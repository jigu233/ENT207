import DailyPlantRecommendation from './DailyPlantRecommendation';
import MyPlantGarden from './MyPlantGarden';

export default function PlantCarePage() {
  return (
    <div className="space-y-6">
      <DailyPlantRecommendation />
      <MyPlantGarden />
    </div>
  );
}
