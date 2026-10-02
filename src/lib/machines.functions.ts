import { createServerFn } from "@tanstack/react-start";

// Read-only fetch of the legacy machine intelligence layer (demo assets).
export const getMachineData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const [assets, types, ip, sm, ra, cp, ev, rules] = await Promise.all([
    db.from("factory_assets").select("*").order("id"),
    db.from("machine_types").select("id,machine_type,category,purpose,detection_targets"),
    db.from("asset_integration_profiles").select("*"),
    db.from("asset_sensor_mappings").select("*").order("id"),
    db.from("retrofit_assessments").select("*"),
    db.from("asset_calibration_profiles").select("*"),
    db.from("intelligence_events").select("*").order("created_at", { ascending: false }),
    db.from("diagnostic_rules").select("id,machine_type_id,problem_code,problem_name,severity,required_metrics"),
  ]);
  const err = [assets, types, ip, sm, ra, cp, ev, rules].find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  return JSON.parse(JSON.stringify({
    assets: assets.data!, types: types.data!, profiles: ip.data!, sensors: sm.data!,
    retrofit: ra.data!, calibration: cp.data!, events: ev.data!, rules: rules.data!,
  })) as {
    assets: any[]; types: any[]; profiles: any[]; sensors: any[]; retrofit: any[];
    calibration: any[]; events: any[]; rules: any[];
  };
});
