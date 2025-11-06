# Instructions de Migration - Table Catégories

## Problème Résolu

Deux problèmes ont été corrigés :

1. ✅ **Tables** : Le restaurant est maintenant créé automatiquement avec une meilleure gestion des erreurs
2. ✅ **Catégories** : Une nouvelle table `categories` dédiée a été créée pour stocker les catégories

## Migration Requise

Pour que la gestion des catégories fonctionne, vous devez créer la table `categories` dans votre base de données Supabase.

### Étapes à suivre :

1. **Ouvrez votre Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Dans le menu latéral, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Copiez et collez ce SQL**

```sql
-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(name, emoji)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Create policies for admin write access
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

COMMENT ON TABLE public.categories IS 'Categories for organizing dishes in the menu';
```

4. **Exécutez la requête**
   - Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)
   - Vous devriez voir le message "Success. No rows returned"

5. **Vérifiez la création**
   - Allez dans **"Table Editor"** dans le menu latéral
   - Vous devriez voir la nouvelle table **"categories"**

## Après la Migration

Une fois la migration effectuée :

### ✅ Pour les Tables
- Vous pouvez maintenant créer des tables sans erreur "restaurant non installé"
- Le système crée automatiquement un restaurant par défaut si nécessaire

### ✅ Pour les Catégories
- Vous pouvez créer des catégories avec emoji
- Les catégories sont maintenant stockées dans une table dédiée
- Le compteur de plats par catégorie fonctionne correctement
- Vous verrez immédiatement les catégories créées dans la liste

## Utilisation

### Créer une Table
1. Allez dans **"🍽️ Tables"** dans l'administration
2. Cliquez sur **"Ajouter une table"**
3. Entrez le numéro de table (ex: 5)
4. Activez/désactivez selon vos besoins
5. Cliquez sur **"Ajouter"**

### Créer une Catégorie
1. Allez dans **"🏷️ Catégories"** dans l'administration
2. Cliquez sur **"Ajouter une catégorie"**
3. Entrez le nom (ex: "Hamburgers")
4. Choisissez un emoji (ex: 🍔) - optionnel
5. Visualisez l'aperçu
6. Cliquez sur **"Ajouter"**
7. La catégorie apparaîtra immédiatement dans la liste

## Support

Si vous rencontrez des problèmes :
- Vérifiez que la migration SQL s'est bien exécutée
- Vérifiez les permissions RLS dans Supabase
- Consultez les logs de la console du navigateur pour plus de détails
