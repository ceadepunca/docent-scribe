import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { Search, Upload, UserPlus, Eye, Edit, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TeacherImportModal } from './TeacherImportModal';
import { TeacherFormModal } from './TeacherFormModal';

export const TeacherManagementTab = () => {
  const navigate = useNavigate();
  const { teachers, loading, fetchTeachers, getTeacherStats, checkTeacherExists } = useTeacherManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [completenessFilter, setCompletenessFilter] = useState('all'); // 'all', 'complete', 'incomplete'
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const stats = getTeacherStats();

  // Consistent DNI normalization function
  const normalizeDNI = (dni: string): string => {
    if (!dni) return '';
    return dni.toString().replace(/\./g, '').replace(/\D/g, '');
  };

  const filteredTeachers = teachers.filter(teacher => {
    // Filter by completeness
    if (completenessFilter !== 'all') {
      const isComplete = teacher.data_complete === true;
      if (completenessFilter === 'complete' && !isComplete) {
        return false;
      }
      if (completenessFilter === 'incomplete' && isComplete) {
        return false;
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const normalizedSearchTerm = normalizeDNI(searchTerm);
      
      const matchesName = teacher.first_name?.toLowerCase().includes(searchLower) || false;
      const matchesLastName = teacher.last_name?.toLowerCase().includes(searchLower) || false;
      const matchesEmail = teacher.email?.toLowerCase().includes(searchLower) || false;
      const matchesLegajo = teacher.legajo_number?.toLowerCase().includes(searchLower) || false;
      const matchesDNI = normalizedSearchTerm && normalizeDNI(teacher.dni || '').includes(normalizedSearchTerm);
      const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.toLowerCase().trim();
      const matchesFullName = fullName.includes(searchLower);
      
      return matchesName || matchesLastName || matchesFullName || matchesEmail || matchesLegajo || matchesDNI;
    }

    return true;
  });

  const getStatusBadge = (teacher: any) => {
    if (teacher.user_id && teacher.data_complete) {
      return <Badge className="bg-green-100 text-green-800">🟢 Registrado</Badge>;
    }
    if (!teacher.user_id && teacher.migrated && teacher.data_complete) {
      return <Badge className="bg-blue-100 text-blue-800">🔵 Migrado</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Incompleto</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Docentes
              </CardTitle>
              <CardDescription>
                Administrar perfiles de docentes y realizar inscripciones asistidas
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button
                onClick={() => setShowImportModal(true)}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Upload className="h-4 w-4" />
                Importar Excel
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                Crear Docente
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/admin/assisted-inscription')}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Inscripción Asistida
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600">{stats.registered}</div>
              <div className="text-xs text-muted-foreground">Registrados</div>
            </div>
            <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.migrated}</div>
              <div className="text-xs text-muted-foreground">Migrados</div>
            </div>
            <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.incomplete}</div>
              <div className="text-xs text-muted-foreground">Incompletos</div>
            </div>
            <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>


          {/* Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, apellido, DNI, email o legajo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={completenessFilter} onValueChange={setCompletenessFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="complete">Completos</SelectItem>
                <SelectItem value="incomplete">Incompletos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCompletenessFilter('all');
              }}
              title="Limpiar filtros"
            >
              Limpiar
            </Button>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
              <strong>Resultados:</strong> {filteredTeachers.length} de {teachers.length} docentes encontrados para "{searchTerm}"
            </div>
          )}

          {/* Teachers Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Legajo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando docentes...
                    </TableCell>
                  </TableRow>
                ) : filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No se encontraron docentes que coincidan con la búsqueda' : 'No hay docentes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.first_name} {teacher.last_name}
                      </TableCell>
                      <TableCell>{teacher.dni || '-'}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.legajo_number || '-'}</TableCell>
                      <TableCell>{getStatusBadge(teacher)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTeacher(teacher)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setShowEditModal(true);
                            }}
                            title="Editar docente"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <TeacherImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        onImportComplete={fetchTeachers}
      />
      
      <TeacherFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSave={fetchTeachers}
      />

      <TeacherFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={fetchTeachers}
        teacher={editingTeacher}
      />

      {/* Teacher Details Modal */}
      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Docente</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <p>{selectedTeacher.first_name} {selectedTeacher.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">DNI</label>
                  <p>{selectedTeacher.dni || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedTeacher.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <p>{selectedTeacher.phone || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Legajo</label>
                  <p>{selectedTeacher.legajo_number || 'No asignado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedTeacher)}</div>
                </div>
              </div>
              
              {selectedTeacher.titulo_1_nombre && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Información Académica</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <p>{selectedTeacher.titulo_1_nombre}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Fecha de Egreso</label>
                      <p>{selectedTeacher.titulo_1_fecha_egreso || 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Promedio</label>
                      <p>{selectedTeacher.titulo_1_promedio || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTeacher(null);
                    setEditingTeacher(selectedTeacher);
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Docente
                </Button>
                <Button onClick={() => setSelectedTeacher(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};