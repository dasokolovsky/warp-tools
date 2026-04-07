import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const SETTINGS_PATH = path.join(process.cwd(), 'settings.json');

const DEFAULT_SETTINGS = {
  company_name: 'My Trucking Co.',
  company_address: '',
  company_phone: '',
  company_email: '',
  default_oil_change_interval_miles: 15000,
  default_oil_change_interval_days: 90,
  default_dot_annual_interval_days: 365,
  default_brake_inspection_interval_miles: 50000,
  notify_days_before: 7,
  notify_on_overdue: true,
};

function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const merged = { ...readSettings(), ...body };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2));
    return NextResponse.json(merged);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
