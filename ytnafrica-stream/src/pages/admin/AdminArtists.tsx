import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, UserCircle, BadgeCheck } from 'lucide-react';
import { api, Artist } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { cn } from '@/lib/utils';

type ArtistFormData = {
  email: string;
  password: string;
  artistName: string;
  verified: boolean;
};

const emptyForm: ArtistFormData = {
  email: '',
  password: '',
  artistName: '',
  verified: false,
};

interface ArtistFormFieldsProps {
  formId: string;
  formData: ArtistFormData;
  onChange: (data: ArtistFormData) => void;
  profileImageFile: File | null;
  onProfileImageChange: (file: File | null) => void;
  onSubmit: () => void;
  submitLabel: string;
  isEdit?: boolean;
}

function ArtistFormFields({
  formId,
  formData,
  onChange,
  profileImageFile,
  onProfileImageChange,
  onSubmit,
  submitLabel,
  isEdit = false,
}: ArtistFormFieldsProps) {
  const verifiedId = `${formId}-verified`;

  const update = (patch: Partial<ArtistFormData>) => {
    onChange({ ...formData, ...patch });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label htmlFor={`${formId}-email`} className="text-sm font-medium">
          Email
        </label>
        <Input
          id={`${formId}-email`}
          type="email"
          autoComplete="off"
          value={formData.email}
          onChange={(e) => update({ email: e.target.value })}
          className="bg-card"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${formId}-password`} className="text-sm font-medium">
          Password
        </label>
        <Input
          id={`${formId}-password`}
          type="password"
          autoComplete="new-password"
          placeholder={isEdit ? 'Leave empty to keep current' : ''}
          value={formData.password}
          onChange={(e) => update({ password: e.target.value })}
          className="bg-card"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${formId}-artistName`} className="text-sm font-medium">
          Artist Name
        </label>
        <Input
          id={`${formId}-artistName`}
          autoComplete="off"
          value={formData.artistName}
          onChange={(e) => update({ artistName: e.target.value })}
          className="bg-card"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${formId}-profile`} className="text-sm font-medium">
          Profile Picture
        </label>
        <Input
          id={`${formId}-profile`}
          type="file"
          accept="image/*"
          onChange={(e) => onProfileImageChange(e.target.files?.[0] || null)}
          className="bg-card"
        />
        {profileImageFile && (
          <p className="text-xs text-muted-foreground">{profileImageFile.name}</p>
        )}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-blue-500" />
          <Label htmlFor={verifiedId}>Blue tick (verified artist)</Label>
        </div>
        <Switch
          id={verifiedId}
          checked={formData.verified}
          onCheckedChange={(checked) => update({ verified: checked })}
        />
      </div>
      <Button type="button" variant="gold" className="w-full" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}

export default function AdminArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [createForm, setCreateForm] = useState<ArtistFormData>(emptyForm);
  const [editForm, setEditForm] = useState<ArtistFormData>(emptyForm);
  const [createProfileFile, setCreateProfileFile] = useState<File | null>(null);
  const [editProfileFile, setEditProfileFile] = useState<File | null>(null);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const data = await api.getArtists();
      setArtists(data);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildFormData = (data: ArtistFormData, file: File | null, includePassword: boolean) => {
    const fd = new FormData();
    fd.append('email', data.email);
    if (includePassword && data.password) {
      fd.append('password', data.password);
    }
    fd.append('artistName', data.artistName);
    fd.append('verified', String(data.verified));
    if (file) {
      fd.append('profileImage', file);
    }
    return fd;
  };

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.artistName) {
      toast({ title: 'Please fill email, password, and artist name', variant: 'destructive' });
      return;
    }
    try {
      await api.createArtist(buildFormData(createForm, createProfileFile, true));
      await fetchArtists();
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
      setCreateProfileFile(null);
      toast({ title: 'Artist account created successfully' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Error creating artist',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedArtist) return;
    if (!editForm.email.trim() || !editForm.artistName.trim()) {
      toast({ title: 'Email and artist name are required', variant: 'destructive' });
      return;
    }
    try {
      const fd = buildFormData(editForm, editProfileFile, false);
      if (editForm.password) {
        fd.append('password', editForm.password);
      }
      await api.updateArtist(selectedArtist.id, fd);
      await fetchArtists();
      setIsEditOpen(false);
      toast({ title: 'Artist updated successfully' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Error updating artist',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteArtist(id);
      await fetchArtists();
      toast({ title: 'Artist deleted successfully' });
    } catch (error) {
      toast({ title: 'Error deleting artist', variant: 'destructive' });
    }
  };

  const openEdit = (artist: Artist) => {
    setSelectedArtist(artist);
    setEditForm({
      email: artist.email,
      password: '',
      artistName: artist.artistName,
      verified: artist.verified,
    });
    setEditProfileFile(null);
    setIsEditOpen(true);
  };

  const filteredArtists = artists.filter(
    (a) =>
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Artists</h1>
          <p className="text-muted-foreground">
            {artists.length} artist accounts — add blue tick to verify
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) {
              setCreateForm(emptyForm);
              setCreateProfileFile(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="gold" className="gap-2">
              <Plus className="w-5 h-5" />
              Add Artist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Artist Account</DialogTitle>
            </DialogHeader>
            <ArtistFormFields
              formId="create-artist"
              formData={createForm}
              onChange={setCreateForm}
              profileImageFile={createProfileFile}
              onProfileImageChange={setCreateProfileFile}
              onSubmit={handleCreate}
              submitLabel="Create Artist"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArtists.map((artist, index) => (
          <Card
            key={artist.id}
            className={cn('glass border-border/50 overflow-hidden', 'opacity-0 animate-fade-in')}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0">
                  {artist.profileImagePath ? (
                    <img src={artist.profileImagePath} alt={artist.artistName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold truncate">{artist.artistName}</h3>
                    <VerifiedBadge verified={artist.verified} size="md" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{artist.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(artist)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Artist</AlertDialogTitle>
                      <AlertDialogDescription>
                        Remove {artist.artistName}? Their uploaded music will remain on the site.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(artist.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArtists.length === 0 && (
        <div className="text-center py-16">
          <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium">No artists found</p>
          <p className="text-muted-foreground">Add artist accounts so they can upload music</p>
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Artist</DialogTitle>
          </DialogHeader>
          <ArtistFormFields
            formId="edit-artist"
            formData={editForm}
            onChange={setEditForm}
            profileImageFile={editProfileFile}
            onProfileImageChange={setEditProfileFile}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
