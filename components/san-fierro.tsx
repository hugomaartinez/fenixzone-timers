import Timer from './timer'

interface CityProps {
  groupId: string;
}

export default function SanFierro({ groupId }: CityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Timer title="C1" cityName="SanFierro" groupId={groupId} />
      <Timer title="C2" cityName="SanFierro" groupId={groupId} />
      <Timer title="C3" cityName="SanFierro" groupId={groupId} />
      <Timer title="C4" cityName="SanFierro" groupId={groupId} />
    </div>
  )
}

