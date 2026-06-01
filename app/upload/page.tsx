import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Volver a campañas
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Subir nueva campaña</h1>
      <p className="text-gray-500 text-sm mb-8">
        Exporta el reporte de resultados desde YCloud y súbelo aquí.
        El sistema detectará automáticamente las columnas y calculará las métricas.
      </p>

      <FileDropzone />

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">¿Cómo exportar desde YCloud?</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Abre tu campaña en YCloud</li>
          <li>Ve a la sección de resultados / reporte</li>
          <li>Exporta como archivo Excel (.xlsx)</li>
          <li>Sube el archivo aquí</li>
        </ol>
      </div>
    </div>
  );
}
