import { LinkButton, EmptyState } from "@/components/common/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <EmptyState title="Page not found" body="The page you are looking for does not exist in this demo." action={<LinkButton href="/">Go to home</LinkButton>} />
    </div>
  );
}
