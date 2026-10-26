import { PageTitle } from "@/components/common/ui";
import { RequestQueue } from "@/components/admin/RequestQueue";

export default function AdminWithdrawals() {
  return (<><PageTitle title="Withdrawal queue" subtitle="Simulated withdrawal requests. No payout is ever made." /><RequestQueue kind="withdrawal" /></>);
}
