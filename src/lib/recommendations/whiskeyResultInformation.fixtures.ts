import {collectedBasicFields,collectedBottlingFields} from './collectedBottlingInformation';
import type {AiSuggestionCard} from './v3Contract';
import type {CollectedBottlingInformation} from './collectedBottlingInformation';
export const collected:CollectedBottlingInformation={status:'NAME_MATCH',checkedAt:'2026-10-26T00:00:00Z',evidenceStatus:'SOURCE_OBSERVATION_UNVERIFIED',
  bottlingIdentityConfirmed:false,datasetBuildId:'a'.repeat(64),recordCount:2,availableVolumesMl:[],
  fields:collectedBottlingFields.map(field=>({field,status:field==='maturationCask'?'OBSERVED':'UNKNOWN',value:field==='maturationCask'?'BOURBON':null,
    sources:field==='maturationCask'?[{url:'https://producer.example/a'}]:[]})),
  basicFields:collectedBasicFields.map(field=>({field,status:field==='abv'||field==='age'?'OBSERVED':'UNKNOWN',value:field==='abv'?'46.3':field==='age'?'12':null,
    sources:field==='abv'||field==='age'?[{url:'https://producer.example/a',observedAt:'2026-10-22T00:00:00Z'}]:[]}))};
export const card:AiSuggestionCard={id:'00000000-0000-4000-8000-000000000012',identity:{brand:'Deanston',expression:'12 Year Old',category:'Single Malt',country:'Scotland',ageStatement:'NUMBERED',ageYears:12,abv:46.3,region:'Highland'},
  presentation:{summary:['저장한 추천 소개예요.'],pairings:[]},notice:'AI',collectedBottlingInformation:collected};
