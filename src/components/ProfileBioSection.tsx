import React from 'react';
import { BANNERS } from '@/data/banners';
import { INTERESTS } from '@/data/interests';

interface ProfileBioSectionProps {
  description: string;
  banners: string[];
  interests: string[];
}

export const ProfileBioSection: React.FC<ProfileBioSectionProps> = ({
  description,
  banners,
  interests,
}) => {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Description */}
        {description && (
          <section>
            <h2 className="font-embroidery text-lg text-embroidery-black mb-4">
              Sobre
            </h2>
            <p className="font-body text-embroidery-black whitespace-pre-wrap leading-relaxed text-justify">
              {description}
            </p>
          </section>
        )}

        {/* Banners */}
        {banners.length > 0 && (
          <section>
            <h2 className="font-embroidery text-lg text-embroidery-black mb-4">
              Suas Bandeiras
            </h2>
            <div className="flex flex-wrap gap-2">
              {banners.map((bannerId) => {
                const banner = BANNERS.find((b) => b.id === bannerId);
                return banner ? (
                  <div
                    key={bannerId}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-terracotta-100 text-terracotta-700 border border-terracotta-300 shadow-embroidery"
                    title={banner.description}
                  >
                    <span className="text-lg">{banner.icon}</span>
                    <span className="text-sm font-body">{banner.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <section>
            <h2 className="font-embroidery text-lg text-embroidery-black mb-4">
              Interesses
            </h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interestId) => {
                const interest = INTERESTS.find((i) => i.id === interestId);
                return interest ? (
                  <div
                    key={interestId}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-terracotta-100 text-terracotta-700 border border-terracotta-300 shadow-embroidery"
                    title={interest.category}
                  >
                    <span className="text-lg">{interest.icon}</span>
                    <span className="text-sm font-body">{interest.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!description && banners.length === 0 && interests.length === 0 && (
          <div className="p-8 text-center bg-linen-50 rounded-lg border border-linen-300">
            <p className="text-sm text-embroidery-gray font-body">
              Perfil em construção
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
