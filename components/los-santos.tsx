import Timer from './timer'

export default function LosSantos() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Timer title="Colinas" cityName="LosSantos" />
      <Timer title="Seville" cityName="LosSantos" />
      <Timer title="Corona" cityName="LosSantos" />
    </div>
  )
}

