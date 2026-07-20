import React, { useState, useEffect } from 'react';
import { PublicProfileHeader } from '@/components/PublicProfileHeader';
import { ProfileBioSection } from '@/components/ProfileBioSection';
import { RodasSection } from '@/components/RodasSection';
import { EventosSection } from '@/components/EventosSection';
import { HonorSection } from '@/components/HonorSection';
import { RODAS } from '@/data/rodas';
import { EVENTOS } from '@/data/eventos';
import type {
  PublicUserProfile,
  Roda,
  Evento,
  Homenagem,
} from '@/types/public-profile';

interface PublicProfilePageProps {
  userId?: string;
  isSelf?: boolean;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({
  userId = '1',
  isSelf = false,
}) => {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showHomenagens, setShowHomenagens] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento de perfil
  useEffect(() => {
    setIsLoading(true);

    // Simular delay de API
    setTimeout(() => {
      const mockProfile: PublicUserProfile = {
        id: userId,
        name: 'Marina Silva',
        avatar: undefined,
        photos: [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=600&fit=crop',
        ],
        description:
          'Ativista social apaixonada por justiça ambiental e direitos indígenas. Trabalho com comunidades na defesa de terras e na construção de alternativas econômicas solidárias. Acredito que outra organização social é possível e necessária. Estou sempre aberta para diálogos, trocas de experiências e construção coletiva.\n\nQuando não estou em ações, você me encontra ouvindo música, lendo sobre história política ou cuidando da horta comunitária do bairro.',
        banners: [
          'indigenous',
          'environmentalism',
          'anticapitalism',
          'intlsolidarity',
          'feminism',
        ],
        interests: [
          'activism',
          'environment',
          'human_rights',
          'music',
          'literature',
          'community_work',
          'philosophy',
          'agriculture',
          'travel',
          'spirituality',
        ],
        rodas: ['roda-1', 'roda-3', 'roda-5'],
        eventos: ['evento-1', 'evento-3', 'evento-5'],
        homenagens: [
          {
            id: 'honor-1',
            fromUserId: 'user-123',
            fromUserName: 'Lucas Santos',
            fromUserAvatar:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop',
            message:
              'Marina é uma inspiração para todos nós. Sua dedicação à causa ambiental e aos direitos indígenas é admirable. Muito obrigado por tudo que faz! 🙏',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            type: 'reconhecimento',
            isVisible: true,
          },
          {
            id: 'honor-2',
            fromUserId: 'user-456',
            fromUserName: 'Ana Costa',
            fromUserAvatar:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop',
            message:
              'Obrigada Marina por nos ajudar com o projeto da horta comunitária. Sem sua organização e dedicação, nada disso seria possível!',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            type: 'agradecimento',
            isVisible: true,
          },
          {
            id: 'honor-3',
            fromUserId: 'user-789',
            fromUserName: 'João Oliveira',
            fromUserAvatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
            message:
              'Conte conosco no próximo protesto. A luta não termina! 💪',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            type: 'apoio',
            isVisible: true,
          },
          {
            id: 'honor-4',
            fromUserId: 'user-321',
            fromUserName: 'Fernanda Dias',
            fromUserAvatar:
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop',
            message:
              'Sua solidariedade com as comunidades indígenas me tocou profundamente. Precisamos de mais pessoas como você neste mundo.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            type: 'solidariedade',
            isVisible: true,
          },
        ],
        showHomenagens: true,
        followers: 284,
        followersOf: 56,
        createdAt: new Date(2024, 2, 15),
        isFollowing: false,
        isSelf,
      };

      setProfile(mockProfile);
      setShowHomenagens(mockProfile.showHomenagens);
      setIsLoading(false);
    }, 500);
  }, [userId, isSelf]);

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    if (profile) {
      setProfile({
        ...profile,
        followers: profile.followers
          ? profile.followers + (isFollowing ? -1 : 1)
          : 1,
      });
    }
  };

  const handleHomenagensToggle = (show: boolean) => {
    setShowHomenagens(show);
    if (profile) {
      setProfile({ ...profile, showHomenagens: show });
    }
  };

  const handleDeleteHomenagem = (id: string) => {
    if (profile) {
      const updatedHomenagens = profile.homenagens.filter((h) => h.id !== id);
      setProfile({ ...profile, homenagens: updatedHomenagens });
    }
  };

  const handleRodaClick = (roda: Roda) => {
    console.log('Roda clicada:', roda);
    // Aqui você poderia navegar para a página da roda
  };

  const handleEventoClick = (evento: Evento) => {
    console.log('Evento clicado:', evento);
    // Aqui você poderia navegar para a página do evento
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linen-texture flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-3xl text-embroidery-black mb-4">
            Carregando perfil...
          </p>
          <div className="w-12 h-12 border-4 border-linen-400 border-t-terracotta-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-linen-texture flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="font-heading text-2xl text-embroidery-black mb-2">
            Perfil não encontrado
          </p>
          <p className="font-body text-embroidery-gray">
            O perfil que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <PublicProfileHeader
        name={profile.name}
        photos={profile.photos}
        followersCount={profile.followers}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        isSelf={isSelf}
      />

      {/* Bio Section */}
      {(profile.description || profile.banners.length > 0 || profile.interests.length > 0) && (
        <ProfileBioSection
          description={profile.description}
          banners={profile.banners}
          interests={profile.interests}
        />
      )}

      {/* Rodas Section */}
      {profile.rodas.length > 0 && (
        <RodasSection
          rodas={RODAS.filter((r) => profile.rodas.includes(r.id))}
          onRodaClick={handleRodaClick}
        />
      )}

      {/* Eventos Section */}
      {profile.eventos.length > 0 && (
        <EventosSection
          eventos={EVENTOS.filter((e) => profile.eventos.includes(e.id))}
          onEventoClick={handleEventoClick}
        />
      )}

      {/* Homenagens Section */}
      <HonorSection
        homenagens={profile.homenagens}
        showHomenagens={showHomenagens}
        onToggleVisibility={handleHomenagensToggle}
        isSelf={isSelf}
        onDeleteHomenagem={handleDeleteHomenagem}
      />

      {/* Footer Spacing */}
      <div className="py-12" />
    </div>
  );
};
