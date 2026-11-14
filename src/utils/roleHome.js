// লগইনের পর শিক্ষক আর স্টুডেন্ট নিজের নিজের পেজে যায়
export const roleHome = (user) => (user?.role === 'teacher' ? '/teacher' : '/my-results');
