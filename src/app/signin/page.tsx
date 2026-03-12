'use client';

import { useRouter } from 'next/navigation';
import { LoginView } from '../../components/views/LoginView';

export default function SigninPage() {
    const router = useRouter();

    return (
        <LoginView
            onLogin={() => {
                router.push('/dashboard');
            }}
        />
    );
}
