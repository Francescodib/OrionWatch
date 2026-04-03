#!/usr/bin/env php
<?php
/**
 * OrionWatch Trajectory Backfill
 *
 * Fetches the full Artemis II trajectory from JPL Horizons (server-side,
 * no CORS issue) and saves it as telemetry-history.json. Run once to
 * populate the archive with the entire mission path.
 *
 * Usage: php cron/backfill-trajectory.php
 */

$OUTPUT_FILE = __DIR__ . '/../data/telemetry-history.json';
$FT_TO_KM   = 0.0003048;

$SPKID  = '-1024';
$CENTER = '500@399';

// Horizons ephemeris starts at ~2026-04-02 01:58:32 TDB
$START  = '2026-04-02 02:00:00';
$END    = date('Y-m-d H:i:s'); // now
$STEP   = '10 min'; // 10 minute steps = ~6 points/hour = ~144/day

function buildHorizonsUrl(string $spkid, string $center, string $start, string $end, string $step): string
{
    $params = http_build_query([
        'format'     => 'json',
        'COMMAND'    => "'$spkid'",
        'EPHEM_TYPE' => 'VECTORS',
        'CENTER'     => "'$center'",
        'START_TIME' => "'$start'",
        'STOP_TIME'  => "'$end'",
        'STEP_SIZE'  => "'$step'",
        'OUT_UNITS'  => "'KM-S'",
        'VEC_TABLE'  => "'2'",
        'VEC_LABELS' => "'YES'",
        'CSV_FORMAT' => "'NO'",
    ]);
    return "https://ssd.jpl.nasa.gov/api/horizons.api?$params";
}

function approxMoonKm(float $epochSec): array
{
    $moonEpoch = strtotime('2000-01-06T00:00:00Z');
    $elapsed = $epochSec - $moonEpoch;
    $period = 27.321661 * 86400;
    $angle = fmod(2 * M_PI * $elapsed / $period, 2 * M_PI);
    $r = 384400;
    return [$r * cos($angle), $r * sin($angle), 0];
}

echo "Fetching Horizons data...\n";

$url = buildHorizonsUrl($SPKID, $CENTER, $START, $END, $STEP);
$json = file_get_contents($url);
if (!$json) die("Failed to fetch Horizons\n");

$data = json_decode($json, true);
if (!isset($data['result'])) die("No result field\n");

$result = $data['result'];

// Check for boundary errors and retry
if (preg_match('/No ephemeris.*prior to.*?(\d{4})-([A-Z]{3})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/i', $result, $m)) {
    $months = [
        'JAN' => '01',
        'FEB' => '02',
        'MAR' => '03',
        'APR' => '04',
        'MAY' => '05',
        'JUN' => '06',
        'JUL' => '07',
        'AUG' => '08',
        'SEP' => '09',
        'OCT' => '10',
        'NOV' => '11',
        'DEC' => '12'
    ];
    $mo = $months[strtoupper($m[2])] ?? '01';
    $newStart = "{$m[1]}-{$mo}-{$m[3]} {$m[4]}:{$m[5]}:{$m[6]}";
    $newStartDt = new DateTime($newStart, new DateTimeZone('UTC'));
    $newStartDt->modify('+2 minutes');
    $START = $newStartDt->format('Y-m-d H:i:s');

    echo "Boundary error, retrying from $START...\n";
    $url = buildHorizonsUrl($SPKID, $CENTER, $START, $END, $STEP);
    $json = file_get_contents($url);
    $data = json_decode($json, true);
    $result = $data['result'] ?? '';
}

// Parse SOE block
$soeIdx = strpos($result, '$$SOE');
$eoeIdx = strpos($result, '$$EOE');
if ($soeIdx === false || $eoeIdx === false) die("No SOE/EOE markers\n");

$block = trim(substr($result, $soeIdx + 5, $eoeIdx - $soeIdx - 5));
$lines = array_filter(array_map('trim', explode("\n", $block)));

$records = [];
$currentTimestamp = null;

foreach ($lines as $line) {
    // Timestamp: "2461133.000000000 = A.D. 2026-Apr-02 12:00:00.0000 TDB"
    if (preg_match('/A\.D\.\s+(\d{4})-([A-Za-z]+)-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/', $line, $tsMatch)) {
        $months = [
            'Jan' => '01',
            'Feb' => '02',
            'Mar' => '03',
            'Apr' => '04',
            'May' => '05',
            'Jun' => '06',
            'Jul' => '07',
            'Aug' => '08',
            'Sep' => '09',
            'Oct' => '10',
            'Nov' => '11',
            'Dec' => '12'
        ];
        $mo = $months[$tsMatch[2]] ?? '01';
        $dtStr = "{$tsMatch[1]}-{$mo}-{$tsMatch[3]}T{$tsMatch[4]}:{$tsMatch[5]}:{$tsMatch[6]}Z";
        $currentTimestamp = strtotime($dtStr);
        continue;
    }

    // Position line: " X = ... Y = ... Z = ..."
    if ($currentTimestamp && preg_match('/X\s*=\s*([-+\d.Ee]+)\s+Y\s*=\s*([-+\d.Ee]+)\s+Z\s*=\s*([-+\d.Ee]+)/i', $line, $posMatch) && !preg_match('/VX/', $line)) {
        $x = (float)$posMatch[1];
        $y = (float)$posMatch[2];
        $z = (float)$posMatch[3];
        continue;
    }

    // Velocity line: " VX = ... VY = ... VZ = ..."
    if ($currentTimestamp && isset($x) && preg_match('/VX\s*=\s*([-+\d.Ee]+)\s+VY\s*=\s*([-+\d.Ee]+)\s+VZ\s*=\s*([-+\d.Ee]+)/i', $line, $velMatch)) {
        $vx = (float)$velMatch[1];
        $vy = (float)$velMatch[2];
        $vz = (float)$velMatch[3];

        $distEarth = sqrt($x * $x + $y * $y + $z * $z);
        $speed = sqrt($vx * $vx + $vy * $vy + $vz * $vz);

        $moon = approxMoonKm($currentTimestamp);
        $distMoon = sqrt(($x - $moon[0]) ** 2 + ($y - $moon[1]) ** 2 + ($z - $moon[2]) ** 2);

        $records[] = [
            't'  => $currentTimestamp * 1000,
            'p'  => [round($x, 2), round($y, 2), round($z, 2)],
            'v'  => [round($vx, 4), round($vy, 4), round($vz, 4)],
            'de' => round($distEarth, 1),
            'dm' => round($distMoon, 1),
            's'  => round($speed, 4),
        ];

        unset($x, $y, $z);
        $currentTimestamp = null;
    }
}

if (empty($records)) die("No records parsed\n");

// Ensure output directory
$dir = dirname($OUTPUT_FILE);
if (!is_dir($dir)) mkdir($dir, 0755, true);

// Merge with existing AROW data (which has different timestamps)
$existing = [];
if (file_exists($OUTPUT_FILE)) {
    $raw = file_get_contents($OUTPUT_FILE);
    $existing = json_decode($raw, true) ?: [];
}

// Combine: Horizons backfill + existing AROW data, deduplicated by time
$all = array_merge($records, $existing);
usort($all, fn($a, $b) => $a['t'] <=> $b['t']);

// Deduplicate (keep entries at least 5 min apart)
$deduped = [];
$lastT = 0;
foreach ($all as $r) {
    if ($r['t'] - $lastT >= 300_000) { // 5 min
        $deduped[] = $r;
        $lastT = $r['t'];
    }
}

$tmpFile = $OUTPUT_FILE . '.tmp';
file_put_contents($tmpFile, json_encode($deduped, JSON_UNESCAPED_SLASHES));
rename($tmpFile, $OUTPUT_FILE);

echo "Done: " . count($deduped) . " records from " . date('Y-m-d H:i', $deduped[0]['t'] / 1000) . " to " . date('Y-m-d H:i', end($deduped)['t'] / 1000) . "\n";
