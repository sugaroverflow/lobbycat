import { config } from "dotenv";
config({ path: ".env.local" });
import { runConsultationsPipeline } from "../src/lib/consultations";
import { runSafetyFrameworksPipeline } from "../src/lib/safety-frameworks";

async function main() {
  console.log("→ consultations pipeline");
  const r1 = await runConsultationsPipeline({});
  console.log(r1);
  console.log("→ safety frameworks pipeline");
  const r2 = await runSafetyFrameworksPipeline({});
  console.log(r2);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
