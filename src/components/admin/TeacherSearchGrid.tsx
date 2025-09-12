import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';

interface TeacherProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dni?: string;
  phone?: string;
  legajo_number?: string;
  migrated: boolean;
  data_complete: boolean;
  titulo_1_nombre?: string;
  titulo_1_fecha_egreso?: string;
  titulo_1_promedio?: number;
  user_id?: string;
}

interface TeacherSearchGridProps {
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onCreateNew: (searchQuery: string) => void;
}

export const TeacherSearchGrid: React.FC<TeacherSearchGridProps> = ({
  onSelectTeacher,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { searchTeachers, searchLoading, searchResults } = useTeacherManagement();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchTeachers(debouncedQuery);
    }
  }, [debouncedQuery, searchTeachers]);

  const handleCreateNew = () => {
    onCreateNew(searchQuery);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Buscar Docente
        </CardTitle>
        <CardDescription>
          Escriba el apellido, nombres o DNI del docente para buscar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por apellido, nombres o DNI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {searchQuery && !searchResults.length && !searchLoading && (
              <Button onClick={handleCreateNew} variant="outline">
                <User className="h-4 w-4 mr-2" />
                Crear Nuevo
              </Button>
            )}
          </div>

          {/* Loading State */}
          {searchLoading && (
            <div className="text-center py-4 text-muted-foreground">
              Buscando docentes...
            </div>
          )}

          {/* No Results */}
          {searchQuery && !searchLoading && searchResults.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <p className="text-muted-foreground">
                No se encontraron docentes con "{searchQuery}"
              </p>
              <Button onClick={handleCreateNew} variant="outline">
                <User className="h-4 w-4 mr-2" />
                Crear nuevo docente
              </Button>
            </div>
          )}

          {/* Results Table */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Nombres</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[100px]">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.last_name}
                      </TableCell>
                      <TableCell>{teacher.first_name}</TableCell>
                      <TableCell>{teacher.dni || 'Sin DNI'}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.migrated ? "secondary" : "default"}>
                          {teacher.migrated ? "Migrado" : "Registrado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => onSelectTeacher(teacher)}
                        >
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Instructions */}
          {!searchQuery && (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Comience escribiendo para buscar docentes</p>
              <p className="text-sm">Puede buscar por apellido, nombres o DNI</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};