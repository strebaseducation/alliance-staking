import React, { useEffect, useMemo} from 'react'
import {Text, VStack} from '@chakra-ui/react'
import AssetInput from '../../AssetInput'
import { useRecoilState} from "recoil";
import {walletState, WalletStatusType} from "state/atoms/walletAtoms";
import {Controller, useForm} from "react-hook-form";
import {delegationAtom, DelegationState} from "state/atoms/delegationAtoms";
import ValidatorInput from "components/ValidatorInput/ValidatorInput";
import tokens from "public/mainnet/white_listed_token_info.json";
import usePrice from "hooks/usePrice";
import useValidators from "hooks/useValidators";

const Undelegate  = ({ delegations, validatorAddress})  => {

    const [{status, address}, _] = useRecoilState(walletState)
    const [currentDelegationState, setCurrentDelegationState] = useRecoilState<DelegationState>(delegationAtom)

    const isWalletConnected = status === WalletStatusType.connected

    const {data: {validators = []} = {}} = useValidators({address})

    const chosenValidator = useMemo(()=>validators.find(v=>v.operator_address === validatorAddress),[validatorAddress])

    const onInputChange = ( tokenSymbol: string | null , amount: number) => {

        if(tokenSymbol){
            setCurrentDelegationState({...currentDelegationState, tokenSymbol:tokenSymbol, amount:Number(amount)})}else{
            setCurrentDelegationState({...currentDelegationState,amount:Number(amount)})
        }
    }

    useEffect(() => {
        const newState: DelegationState = {
            validatorDestAddress: null,
            tokenSymbol: "WHALE",
            amount: 0,
            decimals: 6,
            validatorSrcAddress: chosenValidator?.operator_address,
            validatorSrcName: chosenValidator?.description.moniker,
            denom: null
        }
        setCurrentDelegationState(newState)
    }, [isWalletConnected, chosenValidator])


    const { control } = useForm({
        mode: 'onChange',
        defaultValues: {
             currentDelegationState
        },
    })
    const allDelegations = delegations.filter(d=>d.token.symbol === currentDelegationState.tokenSymbol).filter(d=>currentDelegationState.validatorDestAddress === null || d.delegation.validator_address === currentDelegationState.validatorDestAddress)
    let aggregatedAmount = allDelegations?.reduce((acc, e) => (acc + Number(e?.token?.amount ?? 0)), 0).toFixed(6);
    const [priceList, timestamp] = usePrice() || []

    const price = useMemo(()=>
        priceList[tokens?.find(e=>e.symbol===currentDelegationState.tokenSymbol)?.name], [currentDelegationState,priceList])
    return <VStack
        px={7}
        width="full"
    alignItems="flex-start"
        marginBottom={5}>
        <Text>From</Text>
        <Controller
            name="currentDelegationState"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
        <ValidatorInput
            value={1}
            validatorName={currentDelegationState?.validatorSrcName}
            delegatedOnly={true}
            onChange={(validator) => {
                field.onChange(validator)
                setCurrentDelegationState({
                    ...currentDelegationState,
                    validatorSrcAddress: validator.operator_address,
                    validatorSrcName: validator.description.moniker
                })
            }}
            showList={true}/>)}
        />
        <Text pt={5}>Amount</Text>
        <Controller
            name="currentDelegationState"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
                <AssetInput
                    hideToken={currentDelegationState.tokenSymbol}
                    {...field}
                    token={currentDelegationState}
                    whalePrice={price}
                    balance={aggregatedAmount}
                    minMax={false}
                    disabled={false}
                    onChange={(value, isTokenChange) => {
                        onInputChange(value, 0)
                        field.onChange(value)
                        if(isTokenChange){
                            const denom = tokens.find(t=>t.symbol === value.tokenSymbol).denom
                            setCurrentDelegationState({...currentDelegationState,
                                tokenSymbol: value.tokenSymbol,
                                amount: value.amount,
                            denom: denom})}
                        else{
                            setCurrentDelegationState({...currentDelegationState, amount: value.amount})
                        }
                    }}
                />
            )}
        />
    </VStack>

}

export default Undelegate
