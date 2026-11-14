import { FiArrowRight, FiBarChart2, FiCheckCircle, FiClock } from 'react-icons/fi';
import { FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { CHANNEL_URL } from '../utils/constants.js';
import { roleHome } from '../utils/roleHome.js';

const features = [
  { icon: FiClock, title: 'সময় ধরে পরীক্ষা', text: 'ঠিক পরীক্ষার হলের মতো কোণায় ঘড়ি চলবে, সময় শেষে নিজে থেকেই জমা।' },
  { icon: FiCheckCircle, title: 'সাথে সাথে ফলাফল', text: 'পরীক্ষা শেষ হতেই নম্বর, কোনটা ভুল আর সঠিক উত্তর কোনটা, সব দেখতে পাবে।' },
  { icon: FiBarChart2, title: 'ভুল থেকে শেখো', text: 'কোন প্রশ্নে বারবার ভুল হচ্ছে সেটা ধরতে পারলেই প্রস্তুতি আরও জোরালো হয়।' },
];

// ওয়েবসাইটে ঢুকলে সবার আগে এই পেজ দেখায়
export default function Home() {
  const { user } = useAuth();

  return (
    <div className="grid items-center gap-10 py-2 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:py-8">
      <section>
<p className="mb-3 text-lg md:text-2xl font-semibold text-primary">
  Foundation of Science-এ স্বাগতম
</p>

        <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl lg:text-6xl">
          পরীক্ষার প্রস্তুতি হোক{' '}
          <span className="text-primary underline decoration-secondary decoration-8 underline-offset-4">সহজ</span>, আর আত্মবিশ্বাসের সাথে
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">
          যেকোনো পরীক্ষার আগে সবচেয়ে কাজের জিনিস হলো বেশি বেশি অনুশীলন। এখানে নিজের সময়ে MCQ পরীক্ষা দাও, পরীক্ষা শেষ হতেই নম্বর আর ভুলগুলো দেখে নাও। ভুল থেকে শেখাই সবচেয়ে ভালো প্রস্তুতি।
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link to={roleHome(user)} className="btn btn-primary btn-lg">
              {user.role === 'teacher' ? 'আমার পরীক্ষাগুলো দেখো' : 'আমার ফলাফল দেখো'} <FiArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                পরীক্ষা দেওয়া শুরু করো <FiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                লগইন করো
              </Link>
            </>
          )}
        </div>
        {!user && <p className="mt-3 text-base">পরীক্ষার লিংক পেয়েছ? লিংকে ক্লিক করলেই সরাসরি পরীক্ষার পেজে চলে যাবে।</p>}

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon className="mb-2 text-primary" size={28} aria-hidden="true" />
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-1 text-base leading-relaxed text-base-content/90">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ডানের ক্লিক করার কার্ড: ইউটিউব চ্যানেলে নিয়ে যায় */}
      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noreferrer"
        className="group relative block overflow-hidden rounded-box bg-primary p-6 text-primary-content shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-secondary sm:p-8"
      >
        <div className="relative mx-auto grid h-44 w-44 place-items-center">
          <span className="fos-ring absolute inset-2 rounded-full bg-secondary/60" aria-hidden="true" />
          <span className="fos-ring absolute inset-2 rounded-full bg-secondary/60 [animation-delay:1.2s]" aria-hidden="true" />
          <img src="/logo.png" alt="Foundation of Science" className="fos-float relative h-36 w-36 rounded-full border-4 border-white bg-white" />
        </div>

        <h2 className="mt-6 text-center text-2xl leading-snug font-bold sm:text-3xl">সব ধরনের ক্লাস আর MCQ শর্টকাট এক জায়গায়</h2>
        <p className="mt-3 text-center text-lg leading-relaxed">
          ইউটিউব চ্যানেলে পাবে ক্লাসের ভিডিও আর পরীক্ষার জন্য দরকারি MCQ শর্টকাট। ক্লিক করে এখনই দেখে নাও।
        </p>

        <span className="btn btn-secondary btn-lg mt-6 w-full text-lg">
          <FaYoutube size={26} aria-hidden="true" />
          ইউটিউবে ক্লাস দেখো
          <FiArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </a>
    </div>
  );
}
