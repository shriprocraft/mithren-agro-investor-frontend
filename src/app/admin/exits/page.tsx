import { PageTitle } from "@/components/common/ui";
import { RequestQueue } from "@/components/admin/RequestQueue";

export default function AdminExits() {
  return (<><PageTitle title="Exit / redemption queue" subtitle="Simulated requests from investors. Demo data only." /><RequestQueue kind="exit" /></>);
}
