export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div
      className="p-6 rounded-lg"
      style={{ backgroundColor: '#141414', border: '1px solid rgba(200,169,107,0.15)' }}
    >
      <p style={{ fontSize: '12px', color: 'rgba(248,244,236,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>
        {label}
      </p>
      <p style={{ fontSize: '36px', color: '#C8A96B', fontFamily: "'Cormorant Garamond', serif", marginTop: 8 }}>
        {value}
      </p>
    </div>
  );
}
