/*
  # Allow Users to Create Custom Plants

  ## Changes
    - Add INSERT policy for authenticated users to create custom plants in plants table
    - This enables the custom plant feature where users can add their own plant types

  ## Security
    - Only authenticated users can insert plants
    - Users can create their own custom plant entries for the system
*/

-- Allow authenticated users to insert custom plants
CREATE POLICY "Authenticated users can create custom plants"
  ON plants FOR INSERT
  TO authenticated
  WITH CHECK (true);