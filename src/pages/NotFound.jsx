import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold text-primary">৪০৪</p>
      <h1 className="mt-3 text-2xl font-bold">পেজটা খুঁজে পাওয়া যায়নি</h1>
      <p className="mt-2 text-base-content/85">লিংকটা ঠিক আছে কিনা আরেকবার দেখো, অথবা হোম পেজে ফিরে যাও।</p>
      <Link to="/" className="btn btn-primary mt-6">
        হোম পেজে যাও
      </Link>
    </div>
  );
}
