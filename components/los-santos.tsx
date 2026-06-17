import Timer from './timer'

interface CityProps {
  groupId: string;
}

export default function LosSantos({ groupId }: CityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Timer title="Colinas" cityName="Los Santos" groupId={groupId} />
      <Timer title="Seville" cityName="Los Santos" groupId={groupId} />
      <Timer title="Corona" cityName="Los Santos" groupId={groupId} />
    </div>
  )
}

