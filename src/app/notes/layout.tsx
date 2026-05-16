import './notes.css';

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="notes-route-container">
      {children}
    </div>
  );
}
