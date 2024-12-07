import Timer from './timer'

export default function LasVenturas() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Timer title="Whitewood" cityName="LasVenturas" />
      <Timer title="N1" cityName="LasVenturas" />
      <Timer title="N2" cityName="LasVenturas" />
      <Timer title="Quebrados" cityName="LasVenturas" />
      <Timer title="Cruce" cityName="LasVenturas" />
    </div>
    )
}

