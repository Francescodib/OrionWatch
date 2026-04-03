#!/usr/bin/env php
<?php
/**
 * OrionWatch Telemetry Recorder
 *
 * Fetches live Artemis II telemetry from NASA AROW (Google Cloud Storage)
 * and appends it to a JSON file for the frontend to consume.
 *
 * Run as cron job every 60 seconds:
 *   * * * * * /usr/bin/php /path/to/record-telemetry.php
 *
 * The output file (telemetry-history.json) should be placed in the
 * public web directory so the frontend can fetch it.
 *
 * Data source: NASA Mission Control via GCS bucket p-2-cen1
 * Parameters: P2003-P2005 (ECI position in feet), P2009-P2011 (velocity in ft/s)
 */

// ── Configuration ──────────────────────────────────────────────
$GCS_LIST_URL  = 'https://storage.googleapis.com/storage/v1/b/p-2-cen1/o?prefix=October%2F1%2FOctober&maxResults=1';
$OUTPUT_FILE   = __DIR__ . '/../public/data/telemetry-history.json';
$MAX_RECORDS   = 30000;  // ~10 days at 30s intervals
$DEDUP_SECONDS = 20;     // skip if last record within this window
$FT_TO_KM     = 0.0003048;

// ── Fetch AROW data ────────────────────────────────────────────
function fetchArowData(): ?array {
    global $GCS_LIST_URL, $FT_TO_KM;

    // Step 1: List files to get latest
    $listJson = @file_get_contents($GCS_LIST_URL);
    if ($listJson === false) {
        error_log("OrionWatch: Failed to list AROW files");
        return null;
    }

    $listing = json_decode($listJson, true);
    if (empty($listing['items'])) {
        error_log("OrionWatch: No AROW files found");
        return null;
    }

    $fileName = $listing['items'][0]['name'];

    // Step 2: Download file
    $downloadUrl = 'https://storage.googleapis.com/download/storage/v1/b/p-2-cen1/o/'
                 . urlencode($fileName) . '?alt=media';

    $dataJson = @file_get_contents($downloadUrl);
    if ($dataJson === false) {
        error_log("OrionWatch: Failed to download AROW file: $fileName");
        return null;
    }

    $data = json_decode($dataJson, true);
    if (!$data) {
        error_log("OrionWatch: Invalid JSON in AROW file");
        return null;
    }

    // Step 3: Extract parameters
    $params = [];
    foreach (['2003','2004','2005','2009','2010','2011'] as $num) {
        $key = "Parameter_$num";
        if (!isset($data[$key]) || $data[$key]['Status'] !== 'Good') {
            error_log("OrionWatch: Bad parameter $key");
            return null;
        }
        $params[$num] = (float)$data[$key]['Value'];
    }

    // Step 4: Parse timestamp (format: "2026:093:10:05:51.027")
    $timeStr = $data['Parameter_2003']['Time'];
    preg_match('/(\d{4}):(\d{3}):(\d{2}):(\d{2}):(\d{2})\.?(\d*)/', $timeStr, $m);
    $dt = DateTime::createFromFormat('Y z H i s',
        sprintf('%s %s %s %s %s', $m[1], (int)$m[2]-1, $m[3], $m[4], $m[5]),
        new DateTimeZone('UTC')
    );
    // Fallback if createFromFormat fails
    if (!$dt) {
        $dt = new DateTime('now', new DateTimeZone('UTC'));
        $dt->setDate((int)$m[1], 1, 1);
        $dt->modify('+' . ((int)$m[2] - 1) . ' days');
        $dt->setTime((int)$m[3], (int)$m[4], (int)$m[5]);
    }

    // Step 5: Convert feet → km, ft/s → km/s
    $x  = $params['2003'] * $FT_TO_KM;
    $y  = $params['2004'] * $FT_TO_KM;
    $z  = $params['2005'] * $FT_TO_KM;
    $vx = $params['2009'] * $FT_TO_KM;
    $vy = $params['2010'] * $FT_TO_KM;
    $vz = $params['2011'] * $FT_TO_KM;

    $distEarth = sqrt($x*$x + $y*$y + $z*$z);
    $speed = sqrt($vx*$vx + $vy*$vy + $vz*$vz);

    // Approximate Moon position
    $moonEpoch = strtotime('2000-01-06T00:00:00Z');
    $elapsed = ($dt->getTimestamp() - $moonEpoch);
    $period = 27.321661 * 86400;
    $angle = fmod(2 * M_PI * $elapsed / $period, 2 * M_PI);
    $moonR = 384400;
    $moonX = $moonR * cos($angle);
    $moonY = $moonR * sin($angle);
    $distMoon = sqrt(($x-$moonX)**2 + ($y-$moonY)**2 + $z*$z);

    return [
        't'  => $dt->getTimestamp() * 1000, // epoch ms (JS-compatible)
        'p'  => [round($x, 2), round($y, 2), round($z, 2)],
        'v'  => [round($vx, 4), round($vy, 4), round($vz, 4)],
        'de' => round($distEarth, 1),
        'dm' => round($distMoon, 1),
        's'  => round($speed, 4),
    ];
}

// ── Main ───────────────────────────────────────────────────────

// Ensure output directory exists
$outputDir = dirname($OUTPUT_FILE);
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

// Load existing history
$history = [];
if (file_exists($OUTPUT_FILE)) {
    $raw = file_get_contents($OUTPUT_FILE);
    $history = $raw ? json_decode($raw, true) : [];
    if (!is_array($history)) $history = [];
}

// Fetch new data
$record = fetchArowData();
if ($record === null) {
    echo "No data fetched\n";
    exit(1);
}

// Deduplicate — skip if last record is too recent
if (!empty($history)) {
    $lastT = end($history)['t'];
    if (abs($record['t'] - $lastT) < $DEDUP_SECONDS * 1000) {
        echo "Skipped — duplicate within {$DEDUP_SECONDS}s\n";
        exit(0);
    }
}

// Append
$history[] = $record;

// Trim oldest if over limit
if (count($history) > $MAX_RECORDS) {
    $history = array_slice($history, count($history) - $MAX_RECORDS);
}

// Write atomically (write to temp, then rename)
$tmpFile = $OUTPUT_FILE . '.tmp';
$json = json_encode($history, JSON_UNESCAPED_SLASHES);
file_put_contents($tmpFile, $json);
rename($tmpFile, $OUTPUT_FILE);

$count = count($history);
$distKm = round($record['de']);
echo "OK — {$count} records, dist={$distKm}km\n";
exit(0);
