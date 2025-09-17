'use client';

import { useState } from 'react';

export default function ClusterSeedPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [operationCount, setOperationCount] = useState(0);

    // Combined records: 3 reference + 7 new (total 10 records)
    const clusteredRecords = [
        // Original 3 reference records
        {
            name: "Tech Park Manager",
            age: 35,
            gender: "Male",
            phoneNumber: "9876543201",
            taluka: "Pune City",
            communityName: "Small IT Block Community",
            conflict: false,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8567, 18.5204],
                    [73.8574, 18.5207],
                    [73.8578, 18.5203],
                    [73.8580, 18.5200],
                    [73.8576, 18.5196],
                    [73.8572, 18.5195],
                    [73.8570, 18.5198],
                    [73.8567, 18.5201],
                    [73.8567, 18.5204]
                ]]
            }
        },
        {
            name: "Housing Society Head",
            age: 42,
            gender: "Female",
            phoneNumber: "9765432102",
            taluka: "Pune City",
            communityName: "Residential Cluster Society",
            conflict: true,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8572, 18.5202],
                    [73.8579, 18.5205],
                    [73.8582, 18.5202],
                    [73.8584, 18.5199],
                    [73.8581, 18.5196],
                    [73.8578, 18.5194],
                    [73.8575, 18.5196],
                    [73.8573, 18.5199],
                    [73.8572, 18.5202]
                ]]
            }
        },
        {
            name: "Business Association President",
            age: 38,
            gender: "Male",
            phoneNumber: "9654321103",
            taluka: "Pune City",
            communityName: "Mini Commercial Zone",
            conflict: false,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8575, 18.5200],
                    [73.8582, 18.5203],
                    [73.8585, 18.5201],
                    [73.8586, 18.5198],
                    [73.8588, 18.5197],
                    [73.8589, 18.5194],
                    [73.8586, 18.5193],
                    [73.8583, 18.5194],
                    [73.8581, 18.5196],
                    [73.8578, 18.5197],
                    [73.8576, 18.5199],
                    [73.8575, 18.5200]
                ]]
            }
        },
        // 7 New clustered records
        {
            name: "Arjun Patil",
            age: 32,
            gender: "Male",
            phoneNumber: "9876543211",
            taluka: "Pune City",
            communityName: "Northeast IT Park Community",
            conflict: false,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8585, 18.5210],
                    [73.8592, 18.5213],
                    [73.8595, 18.5210],
                    [73.8597, 18.5207],
                    [73.8594, 18.5204],
                    [73.8590, 18.5203],
                    [73.8587, 18.5205],
                    [73.8585, 18.5208],
                    [73.8585, 18.5210]
                ]]
            }
        },
        {
            name: "Sneha Kulkarni",
            age: 28,
            gender: "Female",
            phoneNumber: "9765432108",
            taluka: "Pune City",
            communityName: "South Residential Society",
            conflict: true,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8565, 18.5190],
                    [73.8572, 18.5193],
                    [73.8575, 18.5190],
                    [73.8577, 18.5187],
                    [73.8574, 18.5184],
                    [73.8570, 18.5183],
                    [73.8567, 18.5185],
                    [73.8565, 18.5188],
                    [73.8565, 18.5190]
                ]]
            }
        },
        {
            name: "Vikram Joshi",
            age: 41,
            gender: "Male",
            phoneNumber: "9654321097",
            taluka: "Pune City",
            communityName: "West Commercial Hub",
            conflict: false,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8550, 18.5200],
                    [73.8557, 18.5203],
                    [73.8560, 18.5200],
                    [73.8562, 18.5197],
                    [73.8559, 18.5194],
                    [73.8555, 18.5193],
                    [73.8552, 18.5195],
                    [73.8550, 18.5198],
                    [73.8550, 18.5200]
                ]]
            }
        },
        {
            name: "Pooja Sharma",
            age: 35,
            gender: "Female",
            phoneNumber: "9543210986",
            taluka: "Pune City",
            communityName: "East Mixed Use Zone",
            conflict: true,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8590, 18.5195],
                    [73.8597, 18.5198],
                    [73.8600, 18.5195],
                    [73.8602, 18.5192],
                    [73.8599, 18.5189],
                    [73.8595, 18.5188],
                    [73.8592, 18.5190],
                    [73.8590, 18.5193],
                    [73.8590, 18.5195]
                ]]
            }
        },
        {
            name: "Rahul Desai",
            age: 29,
            gender: "Male",
            phoneNumber: "9432109875",
            taluka: "Pune City",
            communityName: "Northwest Housing Complex",
            conflict: false,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8555, 18.5215],
                    [73.8562, 18.5218],
                    [73.8565, 18.5215],
                    [73.8567, 18.5212],
                    [73.8564, 18.5209],
                    [73.8560, 18.5208],
                    [73.8557, 18.5210],
                    [73.8555, 18.5213],
                    [73.8555, 18.5215]
                ]]
            }
        },
        {
            name: "Manisha Bhosale",
            age: 38,
            gender: "Female",
            phoneNumber: "9321098764",
            taluka: "Pune City",
            communityName: "Southeast Industrial Area",
            conflict: true,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8580, 18.5185],
                    [73.8587, 18.5188],
                    [73.8590, 18.5185],
                    [73.8592, 18.5182],
                    [73.8589, 18.5179],
                    [73.8585, 18.5178],
                    [73.8582, 18.5180],
                    [73.8580, 18.5183],
                    [73.8580, 18.5185]
                ]]
            }
        },
        {
            name: "Sameer Patwardhan",
            age: 44,
            gender: "Male",
            phoneNumber: "9210987653",
            taluka: "Pune City",
            communityName: "Central Mixed Development",
            conflict: false,
            geoData: {
                type: "Polygon",
                coordinates: [[
                    [73.8570, 18.5210],
                    [73.8577, 18.5213],
                    [73.8580, 18.5210],
                    [73.8582, 18.5207],
                    [73.8579, 18.5204],
                    [73.8575, 18.5203],
                    [73.8572, 18.5205],
                    [73.8570, 18.5208],
                    [73.8570, 18.5210]
                ]]
            }
        }
    ];

    const clearAllRecords = async () => {
        if (!confirm('⚠️ This will permanently DELETE ALL user records from the database. Are you sure?')) {
            return;
        }

        setLoading(true);
        setMessage('');
        setOperationCount(0);

        try {
            // Use the main users route instead of /clear
            const response = await fetch('/api/users', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                setMessage(`🗑️ Successfully cleared ${result.deletedCount} records from the database.`);
            } else {
                setMessage(`❌ Failed to clear database: ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Error clearing database: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    const seedClusteredRecords = async () => {
        if (!confirm(`Add ${clusteredRecords.length} new clustered community records to the database?`)) {
            return;
        }

        setLoading(true);
        setMessage('');
        setOperationCount(0);

        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (let i = 0; i < clusteredRecords.length; i++) {
                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(clusteredRecords[i])
                    });

                    const result = await response.json();

                    if (result.success) {
                        successCount++;
                        setOperationCount(successCount);
                    } else {
                        errorCount++;
                        errors.push(`${clusteredRecords[i].name}: ${result.error}`);
                    }
                } catch (error) {
                    errorCount++;
                    errors.push(`${clusteredRecords[i].name}: ${error.message}`);
                }
            }

            if (successCount === clusteredRecords.length) {
                setMessage(`🎉 Successfully added all ${successCount} clustered community records!`);
            } else if (successCount > 0) {
                setMessage(`✅ Added ${successCount} records successfully. ❌ ${errorCount} failed.\n\nErrors:\n${errors.join('\n')}`);
            } else {
                setMessage(`❌ Failed to add any records. Errors:\n${errors.join('\n')}`);
            }

        } catch (error) {
            setMessage(`❌ Error during seeding process: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🗺️ Clustered Community Data Manager</h1>
                    <p className="text-gray-600">Manage community polygon data with clustered geographic regions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Clear Button */}
                    <div className="text-center">
                        <button
                            onClick={clearAllRecords}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    <span>Clearing...</span>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-2xl mb-2">🗑️</div>
                                    <div>Clear All Records</div>
                                    <div className="text-sm opacity-90">Delete existing data</div>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Add Clustered Records Button */}
                    <div className="text-center">
                        <button
                            onClick={seedClusteredRecords}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    <span>Adding... ({operationCount}/10)</span>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-2xl mb-2">🌱</div>
                                    <div>Add Clustered Records</div>
                                    <div className="text-sm opacity-90">10 community regions</div>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress indicator */}
                {loading && operationCount > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700">Adding Records</span>
                            <span className="text-sm font-medium text-blue-700">{operationCount}/10</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(operationCount / 10) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Message display */}
                {message && (
                    <div className={`rounded-lg p-4 whitespace-pre-line mb-6 ${message.includes('Successfully') || message.includes('🎉')
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : message.includes('cleared')
                                ? 'bg-orange-50 border border-orange-200 text-orange-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        <div className="text-sm">
                            {message}
                        </div>
                    </div>
                )}

                {/* Data Preview */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Clustered Data Overview</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">📍 Geographic Cluster</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Center: 73.857°E, 18.520°N</li>
                                <li>• Radius: ~500m coverage</li>
                                <li>• Area: Pune City region</li>
                                <li>• Zoom level: 17-20 optimal</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">🏘️ Community Types</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• IT Parks & Tech zones</li>
                                <li>• Residential societies</li>
                                <li>• Commercial hubs</li>
                                <li>• Mixed developments</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">⚡ Data Stats</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Total records: {clusteredRecords.length}</li>
                                <li>• Conflict zones: {clusteredRecords.filter(r => r.conflict).length}</li>
                                <li>• Peaceful areas: {clusteredRecords.filter(r => !r.conflict).length}</li>
                                <li>• All with polygon data</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">🎯 Usage Instructions</h4>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li><strong>Clear existing records</strong> to remove scattered old data</li>
                            <li><strong>Add clustered records</strong> for better map visualization</li>
                            <li><strong>View on map</strong> - all regions will be close together</li>
                            <li><strong>Test interactions</strong> - hover, click, and navigate easily</li>
                        </ol>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 text-center space-x-4">
                    <a
                        href="/users"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        📋 View All Records
                    </a>
                    <a
                        href="/"
                        className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        🗺️ View Interactive Map
                    </a>
                </div>
            </div>
        </div>
    );
}
