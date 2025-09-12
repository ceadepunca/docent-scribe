import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MigratedTeacherSelectorProps {
  selectedTeachers: any[];
  onSelectionChange: (teachers: any[]) => void;
  onNext: () => void;
}

export const MigratedTeacherSelector: React.FC<MigratedTeacherSelectorProps> = ({
  selectedTeachers,
  onSelectionChange,
  onNext,
}) => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const teachersPerPage = 10;

  useEffect(() => {
    fetchMigratedTeachers();
  }, [currentPage, searchTerm]);

  const fetchMigratedTeachers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('migrated', true)
        .is('user_id', null);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,dni.ilike.%${searchTerm}%,legajo_number.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * teachersPerPage, currentPage * teachersPerPage - 1)
        .order('last_name');

      if (error) throw error;

      setTeachers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching migrated teachers:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los docentes migrados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherToggle = (teacher: any) => {
    const isSelected = selectedTeachers.some(t => t.id === teacher.id);
    
    if (isSelected) {
      onSelectionChange(selectedTeachers.filter(t => t.id !== teacher.id));
    } else {
      onSelectionChange([...selectedTeachers, teacher]);
    }
  };

  const handleSelectAll = () => {
    const allSelected = teachers.every(teacher => 
      selectedTeachers.some(selected => selected.id === teacher.id)
    );

    if (allSelected) {
      // Deselect all current page teachers
      const currentPageIds = teachers.map(t => t.id);
      onSelectionChange(selectedTeachers.filter(t => !currentPageIds.includes(t.id)));
    } else {
      // Select all current page teachers
      const newTeachers = teachers.filter(teacher => 
        !selectedTeachers.some(selected => selected.id === teacher.id)
      );
      onSelectionChange([...selectedTeachers, ...newTeachers]);
    }
  };

  const totalPages = Math.ceil(totalCount / teachersPerPage);
  const allCurrentPageSelected = teachers.length > 0 && teachers.every(teacher => 
    selectedTeachers.some(selected => selected.id === teacher.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Seleccionar Docentes Migrados
        </CardTitle>
        <CardDescription>
          Busque y seleccione los docentes migrados que desea inscribir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, DNI o legajo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          {selectedTeachers.length > 0 && (
            <Badge variant="secondary">
              {selectedTeachers.length} seleccionados
            </Badge>
          )}
        </div>

        {/* Teachers Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={loading || teachers.length === 0}
                  />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Legajo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando docentes...
                  </TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron docentes migrados
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => {
                  const isSelected = selectedTeachers.some(t => t.id === teacher.id);
                  return (
                    <TableRow 
                      key={teacher.id}
                      className={isSelected ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleTeacherToggle(teacher)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {teacher.first_name} {teacher.last_name}
                      </TableCell>
                      <TableCell>{teacher.dni || '-'}</TableCell>
                      <TableCell>{teacher.legajo_number || '-'}</TableCell>
                      <TableCell>{teacher.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Migrado</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * teachersPerPage + 1} - {Math.min(currentPage * teachersPerPage, totalCount)} de {totalCount} docentes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedTeachers.length > 0 && (
              `${selectedTeachers.length} docente${selectedTeachers.length === 1 ? '' : 's'} seleccionado${selectedTeachers.length === 1 ? '' : 's'}`
            )}
          </div>
          <Button 
            onClick={onNext}
            disabled={selectedTeachers.length === 0}
          >
            Continuar ({selectedTeachers.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};