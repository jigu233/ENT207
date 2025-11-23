/*
  # Add Encyclopedia and Purchase Information to Plants

  ## Changes
    - Add `flower_meaning` (花语寓意) field to plants table
    - Add `encyclopedia_info` (百科知识) field to plants table  
    - Add `purchase_link` (购买链接) field to plants table
    - Update existing plant data with rich information

  ## Notes
    - These fields enhance the daily plant recommendation feature
    - Supports "one-click purchase" functionality
*/

-- Add new fields to plants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'flower_meaning'
  ) THEN
    ALTER TABLE plants ADD COLUMN flower_meaning text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'encyclopedia_info'
  ) THEN
    ALTER TABLE plants ADD COLUMN encyclopedia_info text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plants' AND column_name = 'purchase_link'
  ) THEN
    ALTER TABLE plants ADD COLUMN purchase_link text;
  END IF;
END $$;

-- Update existing plant data with encyclopedia information
UPDATE plants
SET 
  flower_meaning = '坚韧善良、守望幸福。绿萝生命力顽强，象征着永不放弃的精神。',
  encyclopedia_info = '绿萝（学名：Epipremnum aureum）属于天南星科藤芋属植物。原产于所罗门群岛，现已广泛栽培。绿萝是极佳的室内装饰植物之一，能有效吸收甲醛、苯等有害物质，净化空气。其缠绕性强，可攀援生长，也可悬挂栽培，观赏价值极高。'
WHERE name_zh = '绿萝';

UPDATE plants
SET 
  flower_meaning = '可爱顽强、小而美好。多肉代表着在困境中依然保持美好的心态。',
  encyclopedia_info = '多肉植物是指植物营养器官肥大的高等植物，通常具有发达的薄壁组织用以贮藏水分。全世界共有多肉植物一万余种，隶属100余科。它们大部分生长在干旱或一年中有一段时间干旱的地区，形态奇特，色彩丰富，是深受欢迎的观赏植物。'
WHERE name_zh = '多肉植物';

UPDATE plants
SET 
  flower_meaning = '坚强勇敢、不畏艰难。仙人掌在恶劣环境中依然生长，象征着顽强的生命力。',
  encyclopedia_info = '仙人掌（学名：Cactaceae）是石竹目仙人掌科的植物总称。原生于美洲沙漠地带，现已遍布全球。仙人掌具有独特的刺座结构，能有效减少水分蒸发。它们不仅具有观赏价值，还能净化空气、吸收电磁辐射，是现代家居的理想选择。'
WHERE name_zh = '仙人掌';