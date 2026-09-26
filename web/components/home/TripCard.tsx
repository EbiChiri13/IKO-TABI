import TicketCard from "@/components/invite/TicketCard";

export type TripCardProps = {
  readonly href: string;
  readonly name: string;
  readonly start: string;
  readonly end: string;
  readonly photoUrl?: string | null;
};

export default function TripCard({ href, name, start, end, photoUrl }: TripCardProps) {
  return (
    <TicketCard href={href} name={name} start={start} end={end} photoUrl={photoUrl ?? undefined} overlap={false} />
  );
}
