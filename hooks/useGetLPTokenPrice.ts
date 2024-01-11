import { useQuery } from 'react-query';

import { LCDClient } from '@terra-money/feather.js/dist/client/lcd/LCDClient';
import useLCDClient from 'hooks/useLCDClient';
import usePrices from 'hooks/usePrices';
import { convertMicroDenomToDenom } from 'util/conversion';

interface Asset {
    amount: string;
    info: {
        native_token: {
            denom: string;
        }
    }
}

interface PoolInfo {
    assets: Asset[]
    total_share: number
}
export const fetchTotalPoolSupply = async (client: LCDClient, whalePrice: number) => {
  if (!client) {
    return null
  }
  const poolInfo : PoolInfo = await client.wasm.contractQuery('migaloo1xv4ql6t6r8zawlqn2tyxqsrvjpmjfm6kvdfvytaueqe3qvcwyr7shtx0hj', {
    pool: {},
  })
  const totalDollarAmount = poolInfo?.assets.map((asset) => {
    if (asset.info.native_token.denom === 'uwhale') {
      return convertMicroDenomToDenom(asset.amount, 6) * whalePrice
    } else {
      return convertMicroDenomToDenom(asset.amount, 6)
    }
  }).reduce((a, b) => a + b, 0)

  return totalDollarAmount / convertMicroDenomToDenom(poolInfo.total_share, 6)
}
export const useGetLPTokenPrice = () => {
  const client = useLCDClient()
  const [priceList] = usePrices() || []
  const whalePrice = priceList?.Whale
  const { data: lpTokenPrice, isLoading } = useQuery(
    ['getLPInfo', whalePrice],
    async () => await fetchTotalPoolSupply(client, whalePrice), { enabled: Boolean(client) && Boolean(whalePrice) },
  )

  return { lpTokenPrice,
    isLoading }
}
