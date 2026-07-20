'use client';

import React, { useState } from 'react';
import { EmbroideryButton } from '@/components/EmbroideryButton';
import { EmbroideryLogo } from '@/components/EmbroideryLogo';
import type { ThreadColor } from '@/components/EmbroideryButton';

export default function DesignSystemShowcase() {
  const [isLoading, setIsLoading] = useState(false);

  const threadColors: ThreadColor[] = ['black', 'white', 'red', 'gold', 'green', 'blue'];

  return (
    <div className="min-h-screen bg-linen-texture text-embroidery-black p-8">
      {/* Header */}
      <section className="mb-16">
        <div className="flex justify-center mb-8">
          <EmbroideryLogo size="lg" />
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-16">
        <h1 className="font-heading text-5xl mb-2">Tipografia</h1>
        <p className="font-subheading text-2xl text-gray-600 mb-8">
          Sistema de Fontes
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <h2 className="font-heading text-3xl mb-2">Heading</h2>
            <p className="text-xs text-gray-600">Caveat Bold 2.5rem</p>
          </div>

          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <h3 className="font-subheading text-2xl mb-2">Subheading</h3>
            <p className="text-xs text-gray-600">Caveat Regular 1.5rem</p>
          </div>

          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <p className="font-body mb-2">
              Body Text - Fonte do sistema 12px regular para textos corpo
            </p>
            <p className="text-xs text-gray-600">System Font 12px</p>
          </div>

          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <p className="font-embroidery text-xl mb-2">Embroidery Text</p>
            <p className="text-xs text-gray-600">Dancing Script Bold cursivo</p>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section className="mb-16">
        <h1 className="font-heading text-5xl mb-2">Paleta de Cores</h1>
        <p className="font-subheading text-2xl text-gray-600 mb-8">
          Cores do Sistema
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <div className="w-full h-32 bg-gradient-to-br from-linen-300 to-linen-600 rounded-md mb-4 shadow-md" />
            <h3 className="font-embroidery text-lg mb-1">Linen (Linho)</h3>
            <p className="text-xs text-gray-600">#cdbfa7 - Cor primária de fundo</p>
          </div>

          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <div className="w-full h-32 bg-gradient-to-br from-terracotta-300 to-terracotta-700 rounded-md mb-4 shadow-md" />
            <h3 className="font-embroidery text-lg mb-1">Terracotta</h3>
            <p className="text-xs text-gray-600">#ed8242 - Cores de botões e ênfase</p>
          </div>

          <div className="p-6 bg-white/50 rounded-lg shadow-embroidery">
            <div className="w-full h-32 bg-gradient-to-br from-embroidery-dark to-embroidery-gray rounded-md mb-4 shadow-md" />
            <h3 className="font-embroidery text-lg mb-1">Embroidery</h3>
            <p className="text-xs text-gray-600">#1a1a1a - Texto e acentos</p>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="mb-16">
        <h1 className="font-heading text-5xl mb-2">Botões</h1>
        <p className="font-subheading text-2xl text-gray-600 mb-8">
          Componente Parametrizável
        </p>

        <div className="mb-12">
          <h3 className="font-subheading text-xl mb-4">Tamanhos</h3>
          <div className="flex flex-wrap gap-4 p-6 bg-white/50 rounded-lg shadow-embroidery">
            <EmbroideryButton size="sm">Pequeno</EmbroideryButton>
            <EmbroideryButton size="md">Médio</EmbroideryButton>
            <EmbroideryButton size="lg">Grande</EmbroideryButton>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-subheading text-xl mb-4">Cores de Linha</h3>
          <div className="flex flex-wrap gap-4 p-6 bg-white/50 rounded-lg shadow-embroidery">
            {threadColors.map((color) => (
              <EmbroideryButton key={color} threadColor={color}>
                Linha {color}
              </EmbroideryButton>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="font-subheading text-xl mb-4">Estados</h3>
          <div className="flex flex-wrap gap-4 p-6 bg-white/50 rounded-lg shadow-embroidery">
            <EmbroideryButton>Normal</EmbroideryButton>
            <EmbroideryButton disabled>Desabilitado</EmbroideryButton>
            <EmbroideryButton
              isLoading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
            >
              Carregando
            </EmbroideryButton>
          </div>
        </div>
      </section>
    </div>
  );
}
