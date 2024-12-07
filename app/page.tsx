"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LosSantos from "@/components/los-santos";
import SanFierro from "@/components/san-fierro";
import LasVenturas from "@/components/las-venturas";

export default function CitiesApp() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">FenixZone Timers</h1>
      <Tabs defaultValue="los-santos">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="los-santos">Los Santos</TabsTrigger>
          <TabsTrigger value="san-fierro">San Fierro</TabsTrigger>
          <TabsTrigger value="las-venturas">Las Venturas</TabsTrigger>
        </TabsList>
        <TabsContent value="los-santos">
          <LosSantos />
        </TabsContent>
        <TabsContent value="san-fierro">
          <SanFierro />
        </TabsContent>
        <TabsContent value="las-venturas">
          <LasVenturas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
