
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User, UserWithPassword } from '@/types/user';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Edit2, Trash2, Users, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const initialFormState: Omit<UserWithPassword, 'id'> = {
  name: '',
  email: '',
  password: '',
  role: 'cashier',
};

export default function UserManagementPage() {
  const { allUsers, addUser, updateUserRole, deleteUser, user: currentUser } = useAuth();
  const { toast } = useToast();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // Store User, not UserWithPassword
  const [formData, setFormData] = useState<Omit<UserWithPassword, 'id'>>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: 'admin' | 'cashier') => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && !editingUser) { // Name required only for new users
      toast({ title: "Validation Error", description: "Name is required for new users.", variant: "destructive" });
      return;
    }
    if (!formData.email) {
      toast({ title: "Validation Error", description: "Email is required.", variant: "destructive" });
      return;
    }

    if (editingUser) {
      if (editingUser.id === currentUser?.id && formData.role === 'cashier' && currentUser.role === 'admin') {
        const otherAdmins = allUsers.filter(u => u.role === 'admin' && u.id !== currentUser.id);
        if (otherAdmins.length === 0) {
            toast({ title: "Action Denied", description: "Cannot demote the last admin to cashier.", variant: "destructive"});
            return;
        }
      }
      // For now, user update only handles role. Name update could be added later if needed.
      const result = await updateUserRole(editingUser.id, formData.role);
      if (result.success) {
        toast({ title: 'User Updated', description: `${editingUser.email}'s role has been updated.` });
      } else {
        toast({ title: 'Update Failed', description: result.message || 'Could not update user.', variant: 'destructive' });
      }
    } else {
      // Add new user
      if (!formData.password || formData.password.length < 6) {
        toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
        return;
      }
      const result = await addUser({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
      if (result.success) {
        toast({ title: 'User Added', description: `${formData.email} has been added successfully.` });
      } else {
        toast({ title: 'Add Failed', description: result.message || 'Could not add user.', variant: 'destructive' });
      }
    }
    closeFormDialog();
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingUser(null);
    setFormData(initialFormState);
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (userToEdit: User) => { // Takes User type
    setEditingUser(userToEdit);
    // Password field not used for role edit, name is displayed but not editable for role changes
    setFormData({ name: userToEdit.name, email: userToEdit.email, role: userToEdit.role, password: '' });
    setIsFormDialogOpen(true);
  };

  const handleDeleteConfirm = async (userId: string, userDisplayName: string) => {
    if (currentUser?.id === userId) {
        toast({ title: "Action Denied", description: "You cannot delete yourself.", variant: "destructive" });
        return;
    }
    const userToDelete = allUsers.find(u => u.id === userId);
    if (userToDelete?.role === 'admin') {
        const otherAdmins = allUsers.filter(u => u.role === 'admin' && u.id !== userId);
        if (otherAdmins.length === 0) {
            toast({ title: "Action Denied", description: "Cannot delete the last admin.", variant: "destructive" });
            return;
        }
    }

    const result = await deleteUser(userId);
    if (result.success) {
      toast({ title: 'User Deleted', description: `User "${userDisplayName}" has been deleted.`, variant: 'destructive' });
    } else {
      toast({ title: 'Delete Failed', description: result.message || 'Could not delete user.', variant: 'destructive' });
    }
  };
  

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">User Management</CardTitle>
            <CardDescription>Add, edit roles, or delete users.</CardDescription>
          </div>
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <PlusCircle size={18} /> Add New User
          </Button>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={64} className="mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-muted-foreground">No Users Found</h3>
                <p className="text-muted-foreground">Get started by adding your first user.</p>
              </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell className="font-medium">{userItem.name}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell className="capitalize">{userItem.role}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(userItem)} className="mr-1 hover:text-primary">
                      <Edit2 size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/80"
                            disabled={currentUser?.id === userItem.id}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user "{userItem.name}" ({userItem.email}).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteConfirm(userItem.id, userItem.name)} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete user
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User Role' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? `Update the role for ${editingUser.name}. Name and email cannot be changed here.` : 'Fill in the details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required={!editingUser} disabled={!!editingUser} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required disabled={!!editingUser} />
            </div>
            {!editingUser && (
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required minLength={6} />
                <p className="text-xs text-muted-foreground">Min 6 characters.</p>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4">
                 <Button type="button" variant="outline" onClick={closeFormDialog}>Cancel</Button>
              <Button type="submit">{editingUser ? 'Save Role Change' : 'Add User'}</Button>
            </DialogFooter>
          </form>
           {editingUser && editingUser.id === currentUser?.id && editingUser.role === 'admin' && allUsers.filter(u => u.role === 'admin').length === 1 && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-700 text-sm flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                Warning: You are editing the last administrator account. Demoting this account will lock out admin functions.
            </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
