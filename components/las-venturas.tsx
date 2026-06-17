import Timer from './timer'

interface CityProps {
  groupId: string;
}

export default function LasVenturas({ groupId }: CityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Timer title="Whitewood" cityName="LasVenturas" groupId={groupId} />
      <Timer title="N1" cityName="Las Venturas" groupId={groupId} />
      <Timer title="N2" cityName="Las Venturas" groupId={groupId} />
      <Timer title="Quebrados" cityName="Las Venturas" groupId={groupId} />
      <Timer title="Cruce" cityName="Las Venturas" groupId={groupId} />
    </div>
    )
}

