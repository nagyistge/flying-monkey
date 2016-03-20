function _precompile_()
    ccall(:jl_generating_output, Cint, ()) == 1 || return nothing
    precompile(StateSpace.call, (Type{StateSpace.LinearGaussianSSM}, Function, Function, Function, Function, Function,))
    precompile(StateSpace.confirm_matrix_sizes, (Array{Float64, 2}, Array{Float64, 2}, Array{Float64, 2}, Array{Float64, 2}, Array{Float64, 2},))
    precompile(StateSpace.ispossemidef, (Array{Float64, 2},))
end
