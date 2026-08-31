/** Zeigt nie die E-Mail-Adresse einer anderen Lehrkraft in der Community-Übersicht (siehe
 * app/community) - nur den selbst gewählten Anmeldenamen, falls vorhanden, sonst eine
 * anonyme Bezeichnung. */
export function communityAutorLabel(autor: { username: string | null }): string {
  return autor.username ?? "Eine Lehrkraft";
}
