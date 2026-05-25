export function scrollToHelp(): void {
  document.getElementById('admin-help')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
