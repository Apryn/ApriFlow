import type { Asset } from "@/types/database.types";
import type { IAssetAnalyzer } from "../interfaces/analyzers.interface";
import type { AssetAnalysis, AssetAllocation } from "../types";

export class AssetAnalyzer implements IAssetAnalyzer {
  analyze(assets: Asset[]): AssetAnalysis {
    let totalValue = 0;
    let liquidValue = 0;
    let nonLiquidValue = 0;

    for (const asset of assets) {
      const val = Number(asset.value);
      totalValue += val;
      if (asset.is_liquid) {
        liquidValue += val;
      } else {
        nonLiquidValue += val;
      }
    }

    const allocation: AssetAllocation[] = assets.map((asset) => {
      const val = Number(asset.value);
      return {
        assetId: asset.id,
        name: asset.name,
        type: asset.type,
        value: val,
        percentage: totalValue > 0 ? (val / totalValue) * 100 : 0,
        isLiquid: asset.is_liquid,
      };
    });

    const liquidityRatio = totalValue > 0 ? liquidValue / totalValue : 0;

    return {
      totalValue,
      liquidValue,
      nonLiquidValue,
      liquidityRatio,
      allocation,
    };
  }
}
