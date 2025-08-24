'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Plus, Edit, Trash2, Sparkles, Calendar, Heart, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const MONKEY_SPECIES = [
  'Capuchin', 'Rhesus Macaque', 'Mandrill', 'Baboon', 'Howler Monkey', 
  'Spider Monkey', 'Vervet Monkey', 'Proboscis Monkey', 'Squirrel Monkey',
  'Tamarin', 'Marmoset', 'Gibbon', 'Orangutan', 'Chimpanzee', 'Bonobo'
];

const FRUITS = [
  'Banana', 'Apple', 'Mango', 'Papaya', 'Orange', 'Grapes', 
  'Berries', 'Figs', 'Coconut', 'Pineapple', 'Guava', 'Peach'
];

export default function MonkeyRegistry() {
  const [monkeys, setMonkeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMonkey, setSelectedMonkey] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    age_years: '',
    favourite_fruit: '',
    last_checkup_at: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch all monkeys
  const fetchMonkeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monkeys');
      if (!response.ok) throw new Error('Failed to fetch monkeys');
      const data = await response.json();
      setMonkeys(data);
    } catch (error) {
      console.error('Error fetching monkeys:', error);
      toast.error('Failed to load monkeys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonkeys();
  }, []);

  // Form validation
  const validateForm = (data) => {
    const newErrors = {};
    
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.species) newErrors.species = 'Species is required';
    if (!data.age_years || data.age_years < 0 || data.age_years > 100) {
      newErrors.age_years = 'Age must be between 0 and 100';
    }
    if (!data.favourite_fruit) newErrors.favourite_fruit = 'Favourite fruit is required';
    if (!data.last_checkup_at) newErrors.last_checkup_at = 'Last checkup date is required';
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const url = selectedMonkey ? `/api/monkeys/${selectedMonkey.monkey_id}` : '/api/monkeys';
      const method = selectedMonkey ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age_years: parseInt(formData.age_years)
        })
      });
      
      if (!response.ok) throw new Error('Failed to save monkey');
      
      await fetchMonkeys();
      resetForm();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      toast.success(selectedMonkey ? 'Monkey updated successfully!' : 'Monkey added successfully!');
    } catch (error) {
      console.error('Error saving monkey:', error);
      toast.error('Failed to save monkey');
    }
  };

  // Handle delete
  const handleDelete = async (monkeyId) => {
    if (!confirm('Are you sure you want to delete this monkey?')) return;
    
    try {
      const response = await fetch(`/api/monkeys/${monkeyId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete monkey');
      
      await fetchMonkeys();
      toast.success('Monkey deleted successfully!');
    } catch (error) {
      console.error('Error deleting monkey:', error);
      toast.error('Failed to delete monkey');
    }
  };

  // Generate AI description
  const generateDescription = async (monkey) => {
    try {
      toast.info('Generating AI description...');
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: monkey.name,
          species: monkey.species,
          age_years: monkey.age_years,
          favourite_fruit: monkey.favourite_fruit
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate description');
      
      const data = await response.json();
      
      // Update monkey with generated description
      const updateResponse = await fetch(`/api/monkeys/${monkey.monkey_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...monkey,
          description: data.description
        })
      });
      
      if (updateResponse.ok) {
        await fetchMonkeys();
        toast.success('AI description generated and saved!');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Failed to generate AI description');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      species: '',
      age_years: '',
      favourite_fruit: '',
      last_checkup_at: ''
    });
    setErrors({});
    setSelectedMonkey(null);
  };

  // Open edit dialog
  const openEditDialog = (monkey) => {
    setSelectedMonkey(monkey);
    setFormData({
      name: monkey.name,
      species: monkey.species,
      age_years: monkey.age_years.toString(),
      favourite_fruit: monkey.favourite_fruit,
      last_checkup_at: monkey.last_checkup_at
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl">🐒</span>
            <h1 className="text-4xl font-bold text-gray-800">Monkey Registry</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track, manage, and discover fascinating primates with AI-powered descriptions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Monkeys</p>
                  <p className="text-3xl font-bold">{monkeys.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Species Tracked</p>
                  <p className="text-3xl font-bold">
                    {new Set(monkeys.map(m => m.species)).size}
                  </p>
                </div>
                <Heart className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">AI Descriptions</p>
                  <p className="text-3xl font-bold">
                    {monkeys.filter(m => m.description).length}
                  </p>
                </div>
                <Sparkles className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Monkey Button */}
        <div className="mb-6">
          <Button onClick={openAddDialog} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add New Monkey
          </Button>
        </div>

        {/* Monkeys Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Monkeys</CardTitle>
            <CardDescription>
              Manage your monkey registry with detailed information and AI-generated descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p>Loading monkeys...</p>
              </div>
            ) : monkeys.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No monkeys registered yet. Click "Add New Monkey" to get started!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Species</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Favourite Fruit</TableHead>
                      <TableHead>Last Checkup</TableHead>
                      <TableHead>AI Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monkeys.map((monkey) => (
                      <TableRow key={monkey.monkey_id}>
                        <TableCell className="font-medium">{monkey.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{monkey.species}</Badge>
                        </TableCell>
                        <TableCell>{monkey.age_years} years</TableCell>
                        <TableCell>{monkey.favourite_fruit}</TableCell>
                        <TableCell>{formatDate(monkey.last_checkup_at)}</TableCell>
                        <TableCell>
                          {monkey.description ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              ✓ Generated
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateDescription(monkey)}
                              className="text-purple-600 hover:bg-purple-50"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Generate
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(monkey)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(monkey.monkey_id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Monkey Dialog */}
        <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {selectedMonkey ? 'Edit Monkey' : 'Add New Monkey'}
              </DialogTitle>
              <DialogDescription>
                {selectedMonkey 
                  ? 'Update the monkey information below.'
                  : 'Enter the monkey details below. All fields are required.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter monkey name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="species">Species</Label>
                <Select 
                  value={formData.species} 
                  onValueChange={(value) => setFormData(prev => ({...prev, species: value}))}
                >
                  <SelectTrigger className={errors.species ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONKEY_SPECIES.map((species) => (
                      <SelectItem key={species} value={species}>{species}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.species && <p className="text-sm text-red-500 mt-1">{errors.species}</p>}
              </div>

              <div>
                <Label htmlFor="age_years">Age (years)</Label>
                <Input
                  id="age_years"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.age_years}
                  onChange={(e) => setFormData(prev => ({...prev, age_years: e.target.value}))}
                  placeholder="Enter age in years"
                  className={errors.age_years ? 'border-red-500' : ''}
                />
                {errors.age_years && <p className="text-sm text-red-500 mt-1">{errors.age_years}</p>}
              </div>

              <div>
                <Label htmlFor="favourite_fruit">Favourite Fruit</Label>
                <Select 
                  value={formData.favourite_fruit} 
                  onValueChange={(value) => setFormData(prev => ({...prev, favourite_fruit: value}))}
                >
                  <SelectTrigger className={errors.favourite_fruit ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select favourite fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRUITS.map((fruit) => (
                      <SelectItem key={fruit} value={fruit}>{fruit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.favourite_fruit && <p className="text-sm text-red-500 mt-1">{errors.favourite_fruit}</p>}
              </div>

              <div>
                <Label htmlFor="last_checkup_at">Last Checkup Date</Label>
                <Input
                  id="last_checkup_at"
                  type="date"
                  value={formData.last_checkup_at}
                  onChange={(e) => setFormData(prev => ({...prev, last_checkup_at: e.target.value}))}
                  className={errors.last_checkup_at ? 'border-red-500' : ''}
                />
                {errors.last_checkup_at && <p className="text-sm text-red-500 mt-1">{errors.last_checkup_at}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setIsEditDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  {selectedMonkey ? 'Update Monkey' : 'Add Monkey'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}