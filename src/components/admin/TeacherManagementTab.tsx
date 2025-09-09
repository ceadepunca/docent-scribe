import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTeacherManagement } from '@/hooks/useTeacherManagement';
import { Search, Upload, UserPlus, Eye, Edit, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TeacherImportModal } from './TeacherImportModal';
import { TeacherFormModal } from './TeacherFormModal';

export const TeacherManagementTab = () => {
  const navigate = useNavigate();
  const { teachers, loading, fetchTeachers, getTeacherStats } = useTeacherManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const stats = getTeacherStats();

  const filteredTeachers = teachers.filter(teacher =>
    teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.dni?.includes(searchTerm) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.registered}</div>
            <div className="text-sm text-muted-foreground">Registrados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.migrated}</div>
            <div className="text-sm text-muted-foreground">Migrados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.incomplete}</div>
            <div className="text-sm text-muted-foreground">Incompletos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Docentes
              </CardTitle>
              <CardDescription>
                Administrar perfiles de docentes y realizar inscripciones asistidas
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowImportModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar Excel
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Crear Docente
              </Button>
              <Button
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
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

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
                          >
                            <Eye className="h-4 w-4" />
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};