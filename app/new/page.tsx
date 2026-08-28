import NewWorksheetForm from "./NewWorksheetForm";

export default function NewWorksheetPage() {
  return (
    <main>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-800 sm:text-3xl">
          Neues Arbeitsblatt
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Alles auswählen und einstellen – Claude generiert und prüft den Inhalt automatisch.
        </p>
      </div>
      <NewWorksheetForm />
    </main>
  );
}
