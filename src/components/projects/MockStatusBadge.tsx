import { Badge, type Tone } from "@/components/common/ui";
import type { MockStatus } from "@/data/project-dashboard-mock";

const TONE: Record<MockStatus, Tone> = { Active: "ok", Planning: "info", Completed: "neutral" };

export const MockStatusBadge = ({ status }: { status: MockStatus }) => <Badge tone={TONE[status]}>{status}</Badge>;
