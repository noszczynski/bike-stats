import FitParser from 'fit-file-parser';
import { 
  FitTrackpoint, 
  FitLap, 
  FitActivity, 
  ParsedFitFile,
  TrackpointInsert,
  LapInsert
} from '@/types/fit';

/**
 * Parse FIT file buffer and extract activity data
 */
export function parseFitFile(buffer: Buffer): Promise<ParsedFitFile> {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'ms', // meters per second
      lengthUnit: 'm', // meters
      temperatureUnit: 'celsius',
      elapsedTimestampUnit: 's'
    });

    fitParser.parse(buffer, (error: any, result: any) => {
      if (error) {
        reject(new Error(`Error parsing FIT file: ${error}`));
        
return;
      }
      
      if (!result.activity) {
        reject(new Error('No activity data found in FIT file'));
        
return;
      }

      const activity = result.activity;
      const sessions = result.sessions || [];
      const records = result.records || [];
      const laps = result.laps || [];

      // Convert records to trackpoints
      const trackpoints: FitTrackpoint[] = records.map((record: any) => ({
        timestamp: new Date(record.timestamp),
        latitude: record.position_lat,
        longitude: record.position_long,
        altitude: record.altitude,
        distance: record.distance,
        speed: record.speed,
        heart_rate: record.heart_rate,
        cadence: record.cadence,
        temperature: record.temperature
      }));

      // Convert laps
      const fitLaps: FitLap[] = laps.map((lap: any, index: number) => ({
        lap_number: index + 1,
        start_time: new Date(lap.start_time || lap.timestamp),
        end_time: new Date(lap.start_time ? lap.start_time + (lap.total_timer_time * 1000) : lap.timestamp),
        distance: lap.total_distance || 0,
        moving_time: lap.total_timer_time || 0,
        elapsed_time: lap.total_elapsed_time || lap.total_timer_time || 0,
        avg_speed: lap.avg_speed,
        max_speed: lap.max_speed,
        avg_heart_rate: lap.avg_heart_rate,
        max_heart_rate: lap.max_heart_rate,
        avg_cadence: lap.avg_cadence,
        max_cadence: lap.max_cadence,
        total_elevation_gain: lap.total_ascent,
        start_latitude: lap.start_position_lat,
        start_longitude: lap.start_position_long,
        end_latitude: lap.end_position_lat,
        end_longitude: lap.end_position_long
      }));

      /* Get activity summary */
      const session = sessions[0] || {};
      
      const fitActivity: FitActivity = {
        start_time: new Date(activity.timestamp || session.start_time),
        total_time: session.total_timer_time || 0,
        distance: session.total_distance || 0,
        avg_speed: session.avg_speed,
        max_speed: session.max_speed,
        avg_heart_rate: session.avg_heart_rate,
        max_heart_rate: session.max_heart_rate,
        total_elevation_gain: session.total_ascent,
        trackpoints,
        laps: fitLaps
      };

      resolve({
        activity: fitActivity,
        sport: session.sport || 'cycling',
        device: session.device_info?.product_name,
        timestamp: new Date(activity.timestamp || session.start_time)
      });
    });
  });
}

/**
 * Convert FIT trackpoints to database insert format
 */
export function convertTrackpointsForDB(
  trackpoints: FitTrackpoint[], 
  activityId: string
): TrackpointInsert[] {
  return trackpoints.map(tp => ({
    activity_id: activityId,
    timestamp: tp.timestamp,
    latitude: tp.latitude,
    longitude: tp.longitude,
    altitude_m: tp.altitude,
    distance_m: tp.distance,
    speed_ms: tp.speed,
    heart_rate_bpm: tp.heart_rate,
    cadence_rpm: tp.cadence,
    temperature_c: tp.temperature
  }))
}

/**
 * Convert FIT laps to database insert format
 */
export function convertLapsForDB(
  laps: FitLap[], 
  activityId: string
): LapInsert[] {
  return laps.map(lap => ({
    activity_id: activityId,
    lap_number: lap.lap_number,
    start_time: lap.start_time,
    end_time: lap.end_time,
    distance_m: lap.distance,
    moving_time_s: lap.moving_time,
    elapsed_time_s: lap.elapsed_time,
    avg_speed_ms: lap.avg_speed,
    max_speed_ms: lap.max_speed,
    avg_heart_rate_bpm: lap.avg_heart_rate,
    max_heart_rate_bpm: lap.max_heart_rate,
    avg_cadence_rpm: lap.avg_cadence,
    max_cadence_rpm: lap.max_cadence,
    total_elevation_gain_m: lap.total_elevation_gain,
    start_latitude: lap.start_latitude,
    start_longitude: lap.start_longitude,
    end_latitude: lap.end_latitude,
    end_longitude: lap.end_longitude
  }));
}

/**
 * Validate FIT file buffer
 */
export function validateFitFile(buffer: Buffer): boolean {
  try {
    // Check if buffer starts with FIT file header
    if (buffer.length < 14) return false;
    
    // Check FIT header signature
    const headerSize = buffer.readUInt8(0);
    if (headerSize !== 14) return false;
    
    const protocolVersion = buffer.readUInt8(1);
    const profileVersion = buffer.readUInt16LE(2);
    const dataSize = buffer.readUInt32LE(4);
    const dataType = buffer.toString('ascii', 8, 12);
    
    return dataType === '.FIT';
  } catch (error) {
    return false;
  }
}

/**
 * Get basic FIT file info without full parsing
 */
export function getFitFileInfo(buffer: Buffer) {
  if (!validateFitFile(buffer)) {
    throw new Error('Invalid FIT file format');
  }
  
  const headerSize = buffer.readUInt8(0);
  const protocolVersion = buffer.readUInt8(1);
  const profileVersion = buffer.readUInt16LE(2);
  const dataSize = buffer.readUInt32LE(4);
  
  return {
    headerSize,
    protocolVersion,
    profileVersion,
    dataSize,
    fileSize: buffer.length
  };
} 