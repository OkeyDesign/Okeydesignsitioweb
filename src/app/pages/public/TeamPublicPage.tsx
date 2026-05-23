import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase, type TeamMember } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { UserCircle2, Shield, Pencil } from 'lucide-react';

export function TeamPublicPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.query<TeamMember[]>('team_members', {
          select: 'id, name, position, avatar_url, role, content_blocks',
          order: api.asc('created_at'),
        });
        setMembers(data || []);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Mulish, sans-serif' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(22,39,63,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,39,63,0.035) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <header className="max-w-5xl mx-auto px-6 pt-16 pb-12">
          <h1
            className="text-5xl font-bold"
            style={{ color: '#16273F', lineHeight: 1.1 }}
          >
            Conoce al equipo
          </h1>
        </header>

        {/* Team grid */}
        <main className="max-w-5xl mx-auto px-6 pb-24">
          {isLoading ? (
            <TeamSkeleton />
          ) : members.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const hasContent = member.content_blocks && member.content_blocks.length > 0;
  
  const cardContent = (
    <>
      {/* Avatar */}
      <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border-2 border-neutral-100 bg-neutral-50">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserCircle2 size={40} className="text-neutral-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-bold text-[#16273F]" style={{ fontSize: '15px' }}>
        {member.name}
      </h3>
      {member.position && (
        <p className="text-neutral-400 text-xs mt-1">{member.position}</p>
      )}

      {/* Role badge */}
      <div className="mt-3">
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            member.role === 'admin'
              ? 'bg-[#16273F] text-white'
              : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {member.role === 'admin'
            ? <><Shield size={9} /> Admin</>
            : <><Pencil size={9} /> Editor</>}
        </span>
      </div>
    </>
  );

  if (hasContent) {
    return (
      <Link
        to={`/equipo/${member.id}`}
        className="group flex flex-col items-center text-center p-6 rounded-2xl border border-neutral-200 hover:border-[#16273F]/20 hover:shadow-md transition-all bg-white cursor-pointer"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="group flex flex-col items-center text-center p-6 rounded-2xl border border-neutral-200 bg-white opacity-90">
      {cardContent}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: '#F4EFED' }}
      >
        <UserCircle2 size={28} style={{ color: '#16273F' }} />
      </div>
      <p className="text-neutral-500" style={{ fontSize: '17px' }}>
        El equipo se presentará próximamente.
      </p>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-neutral-100 p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 mb-4" />
          <div className="h-4 w-24 bg-neutral-200 rounded mb-2" />
          <div className="h-3 w-16 bg-neutral-100 rounded" />
        </div>
      ))}
    </div>
  );
}