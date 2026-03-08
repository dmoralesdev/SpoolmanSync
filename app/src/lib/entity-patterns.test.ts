/**
 * Comprehensive tests for AMS entity pattern matching
 *
 * Run with: npx tsx src/lib/entity-patterns.test.ts
 */

import {
  matchAmsHumidityEntity,
  matchTrayEntity,
  matchExternalSpoolEntity,
  getExternalSpoolIndex,
  buildAmsPattern,
  buildTrayPattern,
  buildExternalSpoolPattern,
} from './entity-patterns';

interface TestCase {
  name: string;
  entityId: string;
  expected: string | null;
}

interface TrayTestCase {
  name: string;
  entityId: string;
  expected: { amsNumber: string; trayNumber: number } | null;
}

// =============================================================================
// AMS Humidity Sensor Tests
// =============================================================================

const humidityTestCases: TestCase[] = [
  // Standard AMS (X1C, P1S, P1P)
  { name: 'X1C AMS 1 English', entityId: 'sensor.x1c_00m09d462101575_ams_1_humidity', expected: '1' },
  { name: 'X1C AMS 2 English', entityId: 'sensor.x1c_00m09d462101575_ams_2_humidity', expected: '2' },
  { name: 'X1C AMS 3 English', entityId: 'sensor.x1c_00m09d462101575_ams_3_humidity', expected: '3' },
  { name: 'X1C AMS 4 English', entityId: 'sensor.x1c_00m09d462101575_ams_4_humidity', expected: '4' },
  { name: 'P1S AMS 1 German', entityId: 'sensor.p1s_ams_1_luftfeuchtigkeit', expected: '1' },
  { name: 'P1S AMS 2 German', entityId: 'sensor.p1s_ams_2_luftfeuchtigkeit', expected: '2' },
  { name: 'Custom prefix AMS', entityId: 'sensor.my_printer_ams_1_humidity', expected: '1' },

  // AMS Lite (A1, A1 Mini) - no number or "lite" suffix
  { name: 'A1 AMS Lite no number', entityId: 'sensor.schiller_ams_humidity', expected: '1' },
  { name: 'A1 AMS Lite with "lite"', entityId: 'sensor.a1_mini_ams_lite_humidity', expected: 'lite' },
  { name: 'A1 AMS Lite French', entityId: 'sensor.a1_ams_lite_indice_d_humidite', expected: 'lite' },
  { name: 'A1 Mini no number German', entityId: 'sensor.a1_mini_ams_luftfeuchtigkeit', expected: '1' },

  // AMS 2 Pro (P2S) - "_pro" suffix after number (number-first)
  { name: 'P2S AMS Pro English', entityId: 'sensor.bambu_lab_ams_2_pro_humidity', expected: '2' },
  { name: 'P2S AMS Pro German', entityId: 'sensor.bambu_lab_ams_2_pro_luftfeuchtigkeit', expected: '2' },
  { name: 'P2S AMS Pro Dutch', entityId: 'sensor.p2s_printer_ams_1_pro_luchtvochtigheid', expected: '1' },
  { name: 'P2S AMS Pro Spanish', entityId: 'sensor.my_p2s_ams_3_pro_humedad', expected: '3' },

  // AMS Pro 2 - type-first ordering (seen in Danish locale, GitHub Issue #18)
  { name: 'AMS Pro type-first Danish', entityId: 'sensor.p1s_ams_pro_2_fugtighed', expected: '2' },
  { name: 'AMS Pro type-first Danish index', entityId: 'sensor.p1s_ams_pro_2_fugtighedsindeks', expected: '2' },
  { name: 'AMS Pro type-first English', entityId: 'sensor.p1s_ams_pro_2_humidity', expected: '2' },
  { name: 'AMS Pro type-first German', entityId: 'sensor.bambu_lab_ams_pro_1_luftfeuchtigkeit', expected: '1' },
  { name: 'No prefix - ams_pro_2_humidity', entityId: 'sensor.ams_pro_2_humidity', expected: '2' },

  // AMS HT - all naming variants normalize to 128+
  { name: 'AMS HT with 128', entityId: 'sensor.a1_mini_ams_128_humidity', expected: '128' },
  { name: 'AMS HT standalone', entityId: 'sensor.a1_mini_ams_ht_humidity', expected: '128' },
  { name: 'AMS HT 128 German', entityId: 'sensor.printer_ams_128_luftfeuchtigkeit', expected: '128' },
  { name: 'AMS HT standalone German', entityId: 'sensor.printer_ams_ht_luftfeuchtigkeit', expected: '128' },
  // AMS HT type-first (H2C with ams_ht_1_humidity pattern)
  { name: 'AMS HT type-first Italian', entityId: 'sensor.h2c_ams_ht_1_umidita', expected: '128' },
  { name: 'AMS HT type-first English', entityId: 'sensor.h2c_ams_ht_1_humidity', expected: '128' },
  { name: 'AMS HT type-first #2', entityId: 'sensor.h2c_ams_ht_2_humidity', expected: '129' },
  // AMS number-first with ht suffix (ams_1_ht_humidity)
  { name: 'AMS HT number-first suffix', entityId: 'sensor.h2c_ams_1_ht_humidity', expected: '128' },

  // Renamed entities with no printer prefix (GitHub Issue #9 comment)
  { name: 'No prefix - ams_humidity', entityId: 'sensor.ams_humidity', expected: '1' },
  { name: 'No prefix - ams_1_humidity', entityId: 'sensor.ams_1_humidity', expected: '1' },
  { name: 'No prefix - ams_2_humidity', entityId: 'sensor.ams_2_humidity', expected: '2' },
  { name: 'No prefix - ams_lite_humidity', entityId: 'sensor.ams_lite_humidity', expected: 'lite' },
  { name: 'No prefix - ams_2_pro_humidity', entityId: 'sensor.ams_2_pro_humidity', expected: '2' },
  { name: 'No prefix - ams_128_humidity', entityId: 'sensor.ams_128_humidity', expected: '128' },
  { name: 'No prefix - ams_ht_humidity', entityId: 'sensor.ams_ht_humidity', expected: '128' },
  { name: 'No prefix - ams_luftfeuchtigkeit', entityId: 'sensor.ams_luftfeuchtigkeit', expected: '1' },

  // Edge cases - should NOT match
  { name: 'Invalid - no ams', entityId: 'sensor.x1c_humidity', expected: null },
  { name: 'Invalid - wrong type', entityId: 'sensor.x1c_ams_1_temperature', expected: null },
  { name: 'Invalid - binary sensor', entityId: 'binary_sensor.x1c_ams_1_humidity', expected: null },
];

// =============================================================================
// Tray Sensor Tests
// =============================================================================

const trayTestCases: TrayTestCase[] = [
  // Standard AMS (X1C, P1S, P1P)
  { name: 'X1C AMS 1 Tray 1', entityId: 'sensor.x1c_00m09d462101575_ams_1_tray_1', expected: { amsNumber: '1', trayNumber: 1 } },
  { name: 'X1C AMS 1 Tray 4', entityId: 'sensor.x1c_00m09d462101575_ams_1_tray_4', expected: { amsNumber: '1', trayNumber: 4 } },
  { name: 'X1C AMS 2 Tray 2', entityId: 'sensor.x1c_00m09d462101575_ams_2_tray_2', expected: { amsNumber: '2', trayNumber: 2 } },
  { name: 'X1C AMS 4 Tray 3', entityId: 'sensor.x1c_00m09d462101575_ams_4_tray_3', expected: { amsNumber: '4', trayNumber: 3 } },
  { name: 'German slot naming', entityId: 'sensor.p1s_ams_1_slot_2', expected: { amsNumber: '1', trayNumber: 2 } },

  // AMS Lite (A1, A1 Mini) - no number or "lite" suffix
  { name: 'A1 AMS Lite no number', entityId: 'sensor.schiller_ams_tray_1', expected: { amsNumber: '1', trayNumber: 1 } },
  { name: 'A1 AMS Lite with "lite"', entityId: 'sensor.a1_mini_ams_lite_tray_3', expected: { amsNumber: 'lite', trayNumber: 3 } },
  { name: 'A1 AMS Lite slot naming', entityId: 'sensor.a1_ams_slot_2', expected: { amsNumber: '1', trayNumber: 2 } },

  // AMS 2 Pro (P2S) - "_pro" suffix after number (number-first)
  { name: 'P2S AMS Pro Tray 1', entityId: 'sensor.bambu_lab_ams_2_pro_tray_1', expected: { amsNumber: '2', trayNumber: 1 } },
  { name: 'P2S AMS Pro Slot German', entityId: 'sensor.bambu_lab_ams_2_pro_slot_3', expected: { amsNumber: '2', trayNumber: 3 } },
  { name: 'P2S AMS Pro Tray 4', entityId: 'sensor.p2s_ams_1_pro_tray_4', expected: { amsNumber: '1', trayNumber: 4 } },

  // AMS Pro 2 - type-first ordering (seen in Danish locale, GitHub Issue #18)
  { name: 'AMS Pro type-first Danish bakke', entityId: 'sensor.p1s_ams_pro_2_bakke_1', expected: { amsNumber: '2', trayNumber: 1 } },
  { name: 'AMS Pro type-first Danish bakke 4', entityId: 'sensor.p1s_ams_pro_2_bakke_4', expected: { amsNumber: '2', trayNumber: 4 } },
  { name: 'AMS Pro type-first English', entityId: 'sensor.p1s_ams_pro_2_tray_2', expected: { amsNumber: '2', trayNumber: 2 } },
  { name: 'AMS Pro type-first German', entityId: 'sensor.bambu_lab_ams_pro_1_slot_3', expected: { amsNumber: '1', trayNumber: 3 } },
  { name: 'No prefix - ams_pro_2_tray_1', entityId: 'sensor.ams_pro_2_tray_1', expected: { amsNumber: '2', trayNumber: 1 } },

  // AMS HT - all naming variants normalize to 128+
  { name: 'AMS HT with 128 Tray 1', entityId: 'sensor.a1_mini_ams_128_tray_1', expected: { amsNumber: '128', trayNumber: 1 } },
  { name: 'AMS HT standalone Tray 2', entityId: 'sensor.a1_mini_ams_ht_tray_2', expected: { amsNumber: '128', trayNumber: 2 } },
  { name: 'AMS HT 128 Slot German', entityId: 'sensor.printer_ams_128_slot_1', expected: { amsNumber: '128', trayNumber: 1 } },
  { name: 'AMS HT standalone Slot', entityId: 'sensor.printer_ams_ht_slot_4', expected: { amsNumber: '128', trayNumber: 4 } },
  // AMS HT type-first (H2C with ams_ht_1_tray_N pattern)
  { name: 'AMS HT type-first Tray 1', entityId: 'sensor.h2c_ams_ht_1_tray_1', expected: { amsNumber: '128', trayNumber: 1 } },
  { name: 'AMS HT type-first Slot Italian', entityId: 'sensor.h2c_ams_ht_1_slot_2', expected: { amsNumber: '128', trayNumber: 2 } },
  { name: 'AMS HT type-first #2 Tray 1', entityId: 'sensor.h2c_ams_ht_2_tray_1', expected: { amsNumber: '129', trayNumber: 1 } },
  // AMS number-first with ht suffix (ams_1_ht_tray_N)
  { name: 'AMS HT number-first suffix Tray 1', entityId: 'sensor.h2c_ams_1_ht_tray_1', expected: { amsNumber: '128', trayNumber: 1 } },

  // Renamed entities with no printer prefix (GitHub Issue #9 comment)
  { name: 'No prefix - ams_tray_1', entityId: 'sensor.ams_tray_1', expected: { amsNumber: '1', trayNumber: 1 } },
  { name: 'No prefix - ams_tray_4', entityId: 'sensor.ams_tray_4', expected: { amsNumber: '1', trayNumber: 4 } },
  { name: 'No prefix - ams_1_tray_2', entityId: 'sensor.ams_1_tray_2', expected: { amsNumber: '1', trayNumber: 2 } },
  { name: 'No prefix - ams_2_tray_3', entityId: 'sensor.ams_2_tray_3', expected: { amsNumber: '2', trayNumber: 3 } },
  { name: 'No prefix - ams_2_pro_tray_1', entityId: 'sensor.ams_2_pro_tray_1', expected: { amsNumber: '2', trayNumber: 1 } },
  { name: 'No prefix - ams_128_tray_1', entityId: 'sensor.ams_128_tray_1', expected: { amsNumber: '128', trayNumber: 1 } },
  { name: 'No prefix - ams_ht_tray_2', entityId: 'sensor.ams_ht_tray_2', expected: { amsNumber: '128', trayNumber: 2 } },
  { name: 'No prefix - ams_slot_1 German', entityId: 'sensor.ams_slot_1', expected: { amsNumber: '1', trayNumber: 1 } },

  // Edge cases - should NOT match
  { name: 'Invalid - no tray number', entityId: 'sensor.x1c_ams_1_tray', expected: null },
  { name: 'Invalid - humidity not tray', entityId: 'sensor.x1c_ams_1_humidity', expected: null },
];

// =============================================================================
// buildAmsPattern Tests
// =============================================================================

interface BuildPatternTestCase {
  name: string;
  prefix: string;
  entityId: string;
  shouldMatch: boolean;
  expectedAmsNumber?: string;
}

const buildAmsPatternTestCases: BuildPatternTestCase[] = [
  { name: 'Standard AMS match', prefix: 'x1c_00m09d462101575', entityId: 'sensor.x1c_00m09d462101575_ams_1_humidity', shouldMatch: true, expectedAmsNumber: '1' },
  { name: 'AMS Pro number-first match', prefix: 'bambu_lab', entityId: 'sensor.bambu_lab_ams_2_pro_humidity', shouldMatch: true, expectedAmsNumber: '2' },
  { name: 'AMS Pro type-first match', prefix: 'p1s', entityId: 'sensor.p1s_ams_pro_2_fugtighed', shouldMatch: true, expectedAmsNumber: '2' },
  { name: 'AMS HT 128 match', prefix: 'a1_mini', entityId: 'sensor.a1_mini_ams_128_humidity', shouldMatch: true, expectedAmsNumber: '128' },
  { name: 'AMS HT standalone match', prefix: 'a1_mini', entityId: 'sensor.a1_mini_ams_ht_humidity', shouldMatch: true, expectedAmsNumber: '128' },
  { name: 'AMS HT type-first match', prefix: 'h2c', entityId: 'sensor.h2c_ams_ht_1_humidity', shouldMatch: true, expectedAmsNumber: '128' },
  { name: 'AMS HT type-first #2', prefix: 'h2c', entityId: 'sensor.h2c_ams_ht_2_humidity', shouldMatch: true, expectedAmsNumber: '129' },
  { name: 'AMS Lite match', prefix: 'a1_mini', entityId: 'sensor.a1_mini_ams_lite_humidity', shouldMatch: true, expectedAmsNumber: 'lite' },
  { name: 'Wrong prefix no match', prefix: 'x1c', entityId: 'sensor.p1s_ams_1_humidity', shouldMatch: false },
];

// =============================================================================
// buildTrayPattern Tests
// =============================================================================

interface BuildTrayPatternTestCase {
  name: string;
  prefix: string;
  amsNumber: string;
  trayNum: number;
  entityId: string;
  shouldMatch: boolean;
}

const buildTrayPatternTestCases: BuildTrayPatternTestCase[] = [
  { name: 'Standard tray match', prefix: 'x1c', amsNumber: '1', trayNum: 1, entityId: 'sensor.x1c_ams_1_tray_1', shouldMatch: true },
  { name: 'AMS Pro number-first tray match', prefix: 'bambu_lab', amsNumber: '2', trayNum: 1, entityId: 'sensor.bambu_lab_ams_2_pro_tray_1', shouldMatch: true },
  { name: 'AMS Pro type-first tray match', prefix: 'p1s', amsNumber: '2', trayNum: 1, entityId: 'sensor.p1s_ams_pro_2_bakke_1', shouldMatch: true },
  { name: 'AMS Pro type-first tray 4', prefix: 'p1s', amsNumber: '2', trayNum: 4, entityId: 'sensor.p1s_ams_pro_2_bakke_4', shouldMatch: true },
  // AMS HT (amsNumber=128) should match multiple naming patterns
  { name: 'AMS HT tray match (ams_128)', prefix: 'a1_mini', amsNumber: '128', trayNum: 1, entityId: 'sensor.a1_mini_ams_128_tray_1', shouldMatch: true },
  { name: 'AMS HT tray match (ams_128_ht)', prefix: 'a1_mini', amsNumber: '128', trayNum: 1, entityId: 'sensor.a1_mini_ams_128_ht_tray_1', shouldMatch: true },
  { name: 'AMS HT tray match (ams_ht_1)', prefix: 'h2c', amsNumber: '128', trayNum: 1, entityId: 'sensor.h2c_ams_ht_1_tray_1', shouldMatch: true },
  { name: 'AMS HT tray match (ams_ht standalone)', prefix: 'a1_mini', amsNumber: '128', trayNum: 1, entityId: 'sensor.a1_mini_ams_ht_tray_1', shouldMatch: true },
  { name: 'AMS HT slot match (ams_ht_1)', prefix: 'h2c', amsNumber: '128', trayNum: 2, entityId: 'sensor.h2c_ams_ht_1_slot_2', shouldMatch: true },
  // AMS HT should NOT match amsNumber=1
  { name: 'AMS HT should not match amsNumber=1', prefix: 'h2c', amsNumber: '1', trayNum: 1, entityId: 'sensor.h2c_ams_ht_1_tray_1', shouldMatch: false },
  { name: 'AMS Lite no number match', prefix: 'schiller', amsNumber: '1', trayNum: 1, entityId: 'sensor.schiller_ams_tray_1', shouldMatch: true },
  { name: 'Wrong tray no match', prefix: 'x1c', amsNumber: '1', trayNum: 1, entityId: 'sensor.x1c_ams_1_tray_2', shouldMatch: false },
];

// =============================================================================
// Multiple AMS Configuration Tests (simulate real-world setups)
// =============================================================================

interface MultiAmsTestCase {
  name: string;
  entities: string[];
  expectedAmsNumbers: string[];
}

const multiAmsTestCases: MultiAmsTestCase[] = [
  {
    name: 'X1C with 4 standard AMS units',
    entities: [
      'sensor.x1c_ams_1_humidity',
      'sensor.x1c_ams_2_humidity',
      'sensor.x1c_ams_3_humidity',
      'sensor.x1c_ams_4_humidity',
    ],
    expectedAmsNumbers: ['1', '2', '3', '4'],
  },
  {
    name: 'P1S with 2 standard AMS units German',
    entities: [
      'sensor.p1s_ams_1_luftfeuchtigkeit',
      'sensor.p1s_ams_2_luftfeuchtigkeit',
    ],
    expectedAmsNumbers: ['1', '2'],
  },
  {
    name: 'P2S with AMS Pro unit',
    entities: [
      'sensor.bambu_lab_ams_2_pro_luftfeuchtigkeit',
    ],
    expectedAmsNumbers: ['2'],
  },
  {
    name: 'A1 Mini with single AMS Lite (no number)',
    entities: [
      'sensor.a1_mini_ams_humidity',
    ],
    expectedAmsNumbers: ['1'],
  },
  {
    name: 'A1 with AMS Lite explicit naming',
    entities: [
      'sensor.a1_ams_lite_humidity',
    ],
    expectedAmsNumbers: ['lite'],
  },
  {
    name: 'Mixed: standard AMS + AMS HT (index 128)',
    entities: [
      'sensor.printer_ams_1_humidity',
      'sensor.printer_ams_128_humidity',
    ],
    expectedAmsNumbers: ['1', '128'],
  },
  {
    name: 'No prefix: single AMS (renamed entities)',
    entities: [
      'sensor.ams_humidity',
    ],
    expectedAmsNumbers: ['1'],
  },
  {
    name: 'No prefix: multiple AMS units (renamed entities)',
    entities: [
      'sensor.ams_1_humidity',
      'sensor.ams_2_humidity',
    ],
    expectedAmsNumbers: ['1', '2'],
  },
  {
    name: 'P1S with AMS Pro 2 type-first Danish (GitHub Issue #18)',
    entities: [
      'sensor.p1s_ams_pro_2_fugtighed',
    ],
    expectedAmsNumbers: ['2'],
  },
];

// =============================================================================
// Test Runner
// =============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`❌ ${name}`);
    console.log(`   ${err instanceof Error ? err.message : err}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
  }
}

console.log('\n=== AMS Humidity Entity Tests ===\n');

for (const tc of humidityTestCases) {
  test(tc.name, () => {
    const result = matchAmsHumidityEntity(tc.entityId);
    assertEqual(result, tc.expected);
  });
}

console.log('\n=== Tray Entity Tests ===\n');

for (const tc of trayTestCases) {
  test(tc.name, () => {
    const result = matchTrayEntity(tc.entityId);
    assertEqual(result, tc.expected);
  });
}

console.log('\n=== buildAmsPattern Tests ===\n');

for (const tc of buildAmsPatternTestCases) {
  test(tc.name, () => {
    const pattern = buildAmsPattern(tc.prefix);
    const match = tc.entityId.match(pattern);
    if (tc.shouldMatch) {
      if (!match) throw new Error(`Pattern should match but didn't`);
      if (tc.expectedAmsNumber) {
        // Group 1 = number (number-first), Group 2 = number (type-first pro)
        // Group 3 = "lite" or "ht" (standalone), Group 4 = number (type-first ht)
        let amsNum: string;
        if (match[4]) {
          // HT type-first: offset by 127
          amsNum = String(127 + parseInt(match[4], 10));
        } else if (match[3] === 'ht') {
          // Standalone "ht": maps to 128
          amsNum = '128';
        } else {
          amsNum = match[1] || match[2] || match[3] || '1';
        }
        assertEqual(amsNum, tc.expectedAmsNumber);
      }
    } else {
      if (match) throw new Error(`Pattern should NOT match but did`);
    }
  });
}

console.log('\n=== buildTrayPattern Tests ===\n');

for (const tc of buildTrayPatternTestCases) {
  test(tc.name, () => {
    const pattern = buildTrayPattern(tc.prefix, tc.amsNumber, tc.trayNum);
    const match = tc.entityId.match(pattern);
    if (tc.shouldMatch) {
      if (!match) throw new Error(`Pattern should match but didn't`);
    } else {
      if (match) throw new Error(`Pattern should NOT match but did`);
    }
  });
}

console.log('\n=== GitHub Issue #9 - P2S AMS Pro Regression Test ===\n');

// Exact entity IDs from GitHub issue #9
const githubIssue9Entities = [
  'sensor.bambu_lab_ams_2_pro_luftfeuchtigkeit',
  'sensor.bambu_lab_ams_2_pro_slot_1',
  'sensor.bambu_lab_ams_2_pro_slot_2',
  'sensor.bambu_lab_ams_2_pro_slot_3',
  'sensor.bambu_lab_ams_2_pro_slot_4',
];

test('GitHub Issue #9: P2S AMS Pro humidity sensor detection', () => {
  const result = matchAmsHumidityEntity('sensor.bambu_lab_ams_2_pro_luftfeuchtigkeit');
  assertEqual(result, '2');
});

test('GitHub Issue #9: P2S AMS Pro tray 1 detection', () => {
  const result = matchTrayEntity('sensor.bambu_lab_ams_2_pro_slot_1');
  assertEqual(result, { amsNumber: '2', trayNumber: 1 });
});

test('GitHub Issue #9: P2S AMS Pro tray 4 detection', () => {
  const result = matchTrayEntity('sensor.bambu_lab_ams_2_pro_slot_4');
  assertEqual(result, { amsNumber: '2', trayNumber: 4 });
});

test('GitHub Issue #9: All entities should be detected', () => {
  // Humidity should return AMS number
  const humidityResult = matchAmsHumidityEntity(githubIssue9Entities[0]);
  if (!humidityResult) throw new Error('Humidity entity not detected');

  // All 4 trays should be detected
  for (let i = 1; i <= 4; i++) {
    const trayResult = matchTrayEntity(githubIssue9Entities[i]);
    if (!trayResult) throw new Error(`Tray ${i} entity not detected`);
    if (trayResult.trayNumber !== i) throw new Error(`Expected tray ${i}, got ${trayResult.trayNumber}`);
  }
});

console.log('\n=== GitHub Issue #9 Comment - Renamed Entities (No Prefix) ===\n');

// Exact entity IDs from the user's screenshot
const githubIssue9CommentEntities = [
  'sensor.ams_humidity',
  'sensor.ams_tray_1',
  'sensor.ams_dry_pods_humidity',
  'sensor.ams_dry_pods_temperature',
  'sensor.ams_humidity_index',
  'sensor.ams_remaining_drying_time',
  'sensor.ams_temperature',
];

test('GitHub Issue #9 Comment: No-prefix humidity sensor detection', () => {
  const result = matchAmsHumidityEntity('sensor.ams_humidity');
  assertEqual(result, '1');
});

test('GitHub Issue #9 Comment: No-prefix tray detection', () => {
  const result = matchTrayEntity('sensor.ams_tray_1');
  assertEqual(result, { amsNumber: '1', trayNumber: 1 });
});

test('GitHub Issue #9 Comment: humidity_index should NOT match (not a standard humidity name)', () => {
  // "humidity_index" is not in AMS_HUMIDITY_NAMES - it's a separate entity
  const result = matchAmsHumidityEntity('sensor.ams_humidity_index');
  assertEqual(result, null);
});

test('GitHub Issue #9 Comment: Non-AMS entities should not match', () => {
  assertEqual(matchAmsHumidityEntity('sensor.ams_dry_pods_humidity'), null);
  assertEqual(matchAmsHumidityEntity('sensor.ams_temperature'), null);
  assertEqual(matchTrayEntity('sensor.ams_remaining_drying_time'), null);
});

console.log('\n=== Multi-AMS Configuration Tests ===\n');

for (const tc of multiAmsTestCases) {
  test(tc.name, () => {
    const results: string[] = [];
    for (const entityId of tc.entities) {
      const amsNum = matchAmsHumidityEntity(entityId);
      if (amsNum) {
        results.push(amsNum);
      }
    }
    assertEqual(results, tc.expectedAmsNumbers);
  });
}

console.log('\n=== GitHub Issue #18 - AMS Pro 2 Type-First Ordering (Danish) ===\n');

// Exact entity IDs from GitHub issue #18
const githubIssue18Entities = [
  'sensor.p1s_ams_pro_2_fugtighedsindeks',
  'sensor.p1s_ams_pro_2_fugtighed',
  'sensor.p1s_ams_pro_2_temperatur',
  'sensor.p1s_ams_pro_2_resterende_torretid',
  'sensor.p1s_ams_pro_2_bakke_1',
  'sensor.p1s_ams_pro_2_bakke_2',
  'sensor.p1s_ams_pro_2_bakke_3',
  'sensor.p1s_ams_pro_2_bakke_4',
];

test('GitHub Issue #18: AMS Pro 2 humidity sensor (type-first)', () => {
  const result = matchAmsHumidityEntity('sensor.p1s_ams_pro_2_fugtighed');
  assertEqual(result, '2');
});

test('GitHub Issue #18: AMS Pro 2 humidity index (Danish)', () => {
  const result = matchAmsHumidityEntity('sensor.p1s_ams_pro_2_fugtighedsindeks');
  assertEqual(result, '2');
});

test('GitHub Issue #18: AMS Pro 2 tray 1 (bakke)', () => {
  const result = matchTrayEntity('sensor.p1s_ams_pro_2_bakke_1');
  assertEqual(result, { amsNumber: '2', trayNumber: 1 });
});

test('GitHub Issue #18: AMS Pro 2 tray 4 (bakke)', () => {
  const result = matchTrayEntity('sensor.p1s_ams_pro_2_bakke_4');
  assertEqual(result, { amsNumber: '2', trayNumber: 4 });
});

test('GitHub Issue #18: All 4 trays detected', () => {
  for (let i = 1; i <= 4; i++) {
    const trayResult = matchTrayEntity(`sensor.p1s_ams_pro_2_bakke_${i}`);
    if (!trayResult) throw new Error(`Tray ${i} not detected`);
    if (trayResult.amsNumber !== '2') throw new Error(`Expected AMS 2, got ${trayResult.amsNumber}`);
    if (trayResult.trayNumber !== i) throw new Error(`Expected tray ${i}, got ${trayResult.trayNumber}`);
  }
});

test('GitHub Issue #18: A1 AMS Lite Danish entities still work', () => {
  assertEqual(matchAmsHumidityEntity('sensor.a1_ams_lite_fugtighed'), 'lite');
  assertEqual(matchAmsHumidityEntity('sensor.a1_ams_lite_fugtighedsindeks'), 'lite');
  assertEqual(matchTrayEntity('sensor.a1_ams_lite_bakke_1'), { amsNumber: 'lite', trayNumber: 1 });
});

// =============================================================================
// External Spool Entity Tests
// =============================================================================

interface ExternalSpoolTestCase {
  name: string;
  entityId: string;
  shouldMatch: boolean;
}

const externalSpoolTestCases: ExternalSpoolTestCase[] = [
  // English
  { name: 'English older format', entityId: 'sensor.x1c_00m09d462101575_external_spool', shouldMatch: true },
  { name: 'English newer format', entityId: 'sensor.x1c_00m09d462101575_externalspool_external_spool', shouldMatch: true },
  // German
  { name: 'German older format', entityId: 'sensor.p1s_externe_spule', shouldMatch: true },
  { name: 'German newer hybrid', entityId: 'sensor.p1s_externalspool_externe_spule', shouldMatch: true },
  { name: 'German underscore hybrid', entityId: 'sensor.p1s_external_spool_externe_spule', shouldMatch: true },
  { name: 'German fully localized', entityId: 'sensor.p1s_externespule_externe_spule', shouldMatch: true },
  // Dutch (GitHub Issue #38)
  { name: 'Dutch older format', entityId: 'sensor.bambu_lab_p2s_externe_spoel', shouldMatch: true },
  { name: 'Dutch newer hybrid', entityId: 'sensor.bambu_lab_p2s_externalspool_externe_spoel', shouldMatch: true },
  { name: 'Dutch underscore hybrid', entityId: 'sensor.bambu_lab_p2s_external_spool_externe_spoel', shouldMatch: true },
  { name: 'Dutch fully localized', entityId: 'sensor.bambu_lab_p2s_externespoel_externe_spoel', shouldMatch: true },
  // Italian
  { name: 'Italian older format', entityId: 'sensor.printer_bobina_esterna', shouldMatch: true },
  { name: 'Italian newer hybrid', entityId: 'sensor.printer_externalspool_bobina_esterna', shouldMatch: true },
  { name: 'Italian underscore hybrid', entityId: 'sensor.printer_external_spool_bobina_esterna', shouldMatch: true },
  // Spanish
  { name: 'Spanish underscore hybrid', entityId: 'sensor.printer_external_spool_bobina_externa', shouldMatch: true },
  // French
  { name: 'French underscore hybrid', entityId: 'sensor.printer_external_spool_bobine_externe', shouldMatch: true },
  // Czech
  { name: 'Czech underscore hybrid', entityId: 'sensor.printer_external_spool_externi_civka', shouldMatch: true },
  // Danish
  { name: 'Danish underscore hybrid', entityId: 'sensor.printer_external_spool_ekstern_spole', shouldMatch: true },
  // With version suffix
  { name: 'English with version suffix', entityId: 'sensor.x1c_external_spool_2', shouldMatch: true },
  { name: 'Dutch underscore hybrid with suffix', entityId: 'sensor.p2s_external_spool_externe_spoel_2', shouldMatch: true },
  // H2C numbered external spools (GitHub Issue #35)
  { name: 'H2C Italian numbered spool 1', entityId: 'sensor.h2c_externalspool_bobina_esterna', shouldMatch: true },
  { name: 'H2C Italian numbered spool 2', entityId: 'sensor.h2c_externalspool2_bobina_esterna', shouldMatch: true },
  { name: 'H2C Italian numbered spool 3', entityId: 'sensor.h2c_externalspool3_bobina_esterna', shouldMatch: true },
  { name: 'H2C English numbered spool 2', entityId: 'sensor.h2c_externalspool2_external_spool', shouldMatch: true },
  { name: 'H2C German numbered spool 2', entityId: 'sensor.h2c_externalspool2_externe_spule', shouldMatch: true },
  { name: 'H2C underscore numbered spool 2', entityId: 'sensor.h2c_external_spool_2_bobina_esterna', shouldMatch: true },
  // Edge cases - should NOT match
  { name: 'Invalid - binary sensor', entityId: 'binary_sensor.x1c_external_spool_actief', shouldMatch: false },
  { name: 'Invalid - no external', entityId: 'sensor.x1c_spool', shouldMatch: false },
];

console.log('\n=== External Spool Entity Tests (matchExternalSpoolEntity) ===\n');

for (const tc of externalSpoolTestCases) {
  test(tc.name, () => {
    const result = matchExternalSpoolEntity(tc.entityId);
    assertEqual(result, tc.shouldMatch);
  });
}

console.log('\n=== External Spool Pattern Tests (buildExternalSpoolPattern) ===\n');

test('GitHub Issue #38: Dutch underscore hybrid with prefix', () => {
  const pattern = buildExternalSpoolPattern('bambu_lab_p2s');
  const match = 'sensor.bambu_lab_p2s_external_spool_externe_spoel'.match(pattern);
  if (!match) throw new Error('Pattern should match but didn\'t');
});

test('buildExternalSpoolPattern: English older format', () => {
  const pattern = buildExternalSpoolPattern('x1c');
  const match = 'sensor.x1c_external_spool'.match(pattern);
  if (!match) throw new Error('Pattern should match but didn\'t');
});

test('buildExternalSpoolPattern: Wrong prefix does not match', () => {
  const pattern = buildExternalSpoolPattern('x1c');
  const match = 'sensor.p1s_external_spool'.match(pattern);
  if (match) throw new Error('Pattern should NOT match but did');
});

test('buildExternalSpoolPattern: H2C numbered spool 1 (no digit)', () => {
  const pattern = buildExternalSpoolPattern('h2c');
  const match = 'sensor.h2c_externalspool_bobina_esterna'.match(pattern);
  if (!match) throw new Error('Pattern should match but didn\'t');
});

test('buildExternalSpoolPattern: H2C numbered spool 2', () => {
  const pattern = buildExternalSpoolPattern('h2c');
  const match = 'sensor.h2c_externalspool2_bobina_esterna'.match(pattern);
  if (!match) throw new Error('Pattern should match but didn\'t');
});

test('buildExternalSpoolPattern: underscore numbered spool 2', () => {
  const pattern = buildExternalSpoolPattern('h2c');
  const match = 'sensor.h2c_external_spool_2_bobina_esterna'.match(pattern);
  if (!match) throw new Error('Pattern should match but didn\'t');
});

// =============================================================================
// getExternalSpoolIndex Tests
// =============================================================================

console.log('\n=== getExternalSpoolIndex Tests ===\n');

test('getExternalSpoolIndex: unnumbered externalspool returns 1', () => {
  assertEqual(getExternalSpoolIndex('sensor.h2c_externalspool_bobina_esterna'), 1);
});

test('getExternalSpoolIndex: externalspool2 returns 2', () => {
  assertEqual(getExternalSpoolIndex('sensor.h2c_externalspool2_bobina_esterna'), 2);
});

test('getExternalSpoolIndex: externalspool3 returns 3', () => {
  assertEqual(getExternalSpoolIndex('sensor.h2c_externalspool3_bobina_esterna'), 3);
});

test('getExternalSpoolIndex: external_spool_2 returns 2', () => {
  assertEqual(getExternalSpoolIndex('sensor.h2c_external_spool_2_bobina_esterna'), 2);
});

test('getExternalSpoolIndex: older format (no prefix) returns 1', () => {
  assertEqual(getExternalSpoolIndex('sensor.p1s_externe_spule'), 1);
});

test('getExternalSpoolIndex: English external_spool returns 1', () => {
  assertEqual(getExternalSpoolIndex('sensor.x1c_external_spool'), 1);
});

// =============================================================================
// H2C Multi-AMS + AMS HT Collision Tests (GitHub Issue #35)
// =============================================================================

console.log('\n=== H2C AMS HT Collision Tests (GitHub Issue #35) ===\n');

test('H2C: Regular AMS 1 + AMS 2 + AMS HT should NOT collide', () => {
  // Simulates a printer with regular AMS 1, AMS 2, and AMS HT
  const ams1 = matchAmsHumidityEntity('sensor.h2c_ams_1_humidity');
  const ams2 = matchAmsHumidityEntity('sensor.h2c_ams_2_humidity');
  const amsHt = matchAmsHumidityEntity('sensor.h2c_ams_ht_1_umidita');
  assertEqual(ams1, '1');
  assertEqual(ams2, '2');
  assertEqual(amsHt, '128');
  // All three must be distinct
  if (ams1 === amsHt) throw new Error('AMS 1 and AMS HT should have different numbers');
  if (ams2 === amsHt) throw new Error('AMS 2 and AMS HT should have different numbers');
});

test('H2C: AMS HT trays should NOT be assigned to regular AMS 1', () => {
  // AMS HT type-first entity should NOT match when looking for amsNumber '1'
  const trayPattern1 = buildTrayPattern('h2c', '1', 1);
  const htEntity = 'sensor.h2c_ams_ht_1_tray_1';
  const match = htEntity.match(trayPattern1);
  if (match) throw new Error('AMS HT tray should not match when querying for amsNumber="1"');
});

test('H2C: AMS HT trays SHOULD match when querying for amsNumber 128', () => {
  const trayPattern128 = buildTrayPattern('h2c', '128', 1);
  const htEntity = 'sensor.h2c_ams_ht_1_tray_1';
  const match = htEntity.match(trayPattern128);
  if (!match) throw new Error('AMS HT tray should match when querying for amsNumber="128"');
});

// =============================================================================
// Summary
// =============================================================================

console.log('\n=== Summary ===\n');
console.log(`Total: ${passed + failed} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
