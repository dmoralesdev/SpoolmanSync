import { NextRequest, NextResponse } from 'next/server';
import {
  getAlertConfig,
  saveAlertConfig,
  getActiveAlerts,
  checkAndUpdateAlerts,
  getAvailableGroups,
  AlertConfig,
} from '@/lib/alerts';

export async function GET(request: NextRequest) {
  try {
    const [config, alerts] = await Promise.all([
      getAlertConfig(),
      getActiveAlerts(),
    ]);
    const strategyParam = request.nextUrl.searchParams.get('strategy');
    const strategy = strategyParam && ['material', 'material_name', 'material_name_vendor'].includes(strategyParam)
      ? strategyParam as AlertConfig['groupingStrategy']
      : config.groupingStrategy;
    const availableGroups = await getAvailableGroups(strategy);
    return NextResponse.json({ config, alerts, availableGroups });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    return NextResponse.json({ error: 'Failed to get alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const config: AlertConfig = {
      enabled: Boolean(body.enabled),
      thresholdType: body.thresholdType === 'grams' ? 'grams' : 'percentage',
      thresholdValue: Math.max(0, Number(body.thresholdValue) || 0),
      groupingStrategy: ['material', 'material_name', 'material_name_vendor'].includes(body.groupingStrategy)
        ? body.groupingStrategy
        : 'material',
      monitoredGroups: Array.isArray(body.monitoredGroups) ? body.monitoredGroups.filter((g: unknown) => typeof g === 'string') : undefined,
    };

    await saveAlertConfig(config);

    // Immediately re-evaluate alerts with new config
    const alerts = await checkAndUpdateAlerts();

    return NextResponse.json({ success: true, config, alerts });
  } catch (error) {
    console.error('Failed to save alert config:', error);
    return NextResponse.json({ error: 'Failed to save alert config' }, { status: 500 });
  }
}
