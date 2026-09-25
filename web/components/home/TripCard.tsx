import TicketCard from "@/components/invite/TicketCard";

export type TripCardProps = {
  readonly groupId: string;
  readonly href: string;
  readonly name: string;
  readonly start: string;
  readonly end: string;
  readonly photoUrl?: string | null;
};

export default function TripCard({ groupId, href, name, start, end, photoUrl }: TripCardProps) {
  return (
    <TicketCard
      groupId={groupId}
      href={href}
      name={name}
      start={start}
      end={end}
      photoUrl={photoUrl ?? undefined}
      overlap={false}
    />
  );
}
