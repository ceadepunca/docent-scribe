import React from 'react';
import { ListingGenerator } from '@/components/ListingGenerator';

const Listings: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Listados de Mérito</h1>
        <p className="text-muted-foreground mt-2">
          Genere listados personalizados por escuela, materia y cargo
        </p>
      </div>
      
      <ListingGenerator />
    </div>
  );
};

export default Listings;