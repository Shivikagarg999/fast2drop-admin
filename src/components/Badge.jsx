const MAP = {
  pending:   'bg-yellow-100 text-yellow-800',
  accepted:  'bg-blue-100 text-blue-800',
  arrived:   'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid:      'bg-green-100 text-green-800',
  failed:    'bg-red-100 text-red-800',
  refunded:  'bg-gray-100 text-gray-700',
  cod:       'bg-amber-100 text-amber-800',
  razorpay:  'bg-blue-100 text-blue-800',
  true:      'bg-green-100 text-green-800',
  false:     'bg-red-100 text-red-800',
};

export default function Badge({ value, label }) {
  const key = String(value ?? '').toLowerCase();
  const cls = MAP[key] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label ?? value}
    </span>
  );
}
